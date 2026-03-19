import type { RequestResolver, Stream } from 'effect'
import {
  Array,
  Effect,
  Request as EffectRequest,
  Either,
  HashMap,
  Option,
  Record,
  pipe,
} from 'effect'

import { UnhandledError } from '@assessmentis/ontology'
import { DeferredActionWriter } from '@assessmentis/util'

import * as Origin from '../origin'
import type * as Resource from '../resource'
import type * as ResourceRequest from '../resource-request'

import { awaitOriginReady } from './origin-resolution'
import { failEntry } from './types'
import type { AnyEntry, AnyRequest, HubError, HubState, OriginBoundEntry } from './types'

// --- Resolver pipeline ---

/**
 * Separates global searches (origin `null`) from origin-bound entries.
 * Global searches are resolved via {@link fanOutSearch} to all matching
 * origins; the remaining entries pass through unchanged.
 */
export const fanOutSearches = <Classes extends Resource.AnyDomainClass>(
  entries: readonly AnyEntry<Classes>[],
  originStates: HubState,
  stateChanges: Stream.Stream<Either.Either<HubState, HubError>>
): DeferredActionWriter.DeferredActionWriter<readonly OriginBoundEntry<Classes>[]> => {
  const globalSearches = entries.filter(
    (
      entry
    ): entry is EffectRequest.Entry<
      ResourceRequest.Search<Classes> & {
        readonly origin: null
      }
    > => entry.request._tag === 'Search' && entry.request.origin === null
  )
  const otherEntries = entries.filter(
    (entry): entry is OriginBoundEntry<Classes> =>
      entry.request._tag !== 'Search' || entry.request.origin !== null
  )

  const searchActions = globalSearches.map((entry) =>
    EffectRequest.completeEffect(
      entry.request,
      fanOutSearch(entry.request, originStates, stateChanges)
    )
  )
  return DeferredActionWriter.of(otherEntries, searchActions)
}

/**
 * Groups origin-bound entries by their `origin` URL, pairing each group with
 * its origin state. Entries whose origin URL has no matching state
 * are failed with `UnhandledError`.
 */
export const groupByOrigin = <Classes extends Resource.AnyDomainClass>(
  entries: readonly OriginBoundEntry<Classes>[],
  originStates: HubState
): DeferredActionWriter.DeferredActionWriter<
  readonly {
    origin: Origin.AnyState<never>
    entries: AnyEntry<Classes>[]
  }[]
> => {
  const grouped = Array.groupBy(entries, (entry) => entry.request.origin.toString())
  const [unmatched, matched] = pipe(
    Record.toEntries(grouped),
    Array.partitionMap(([key, originEntries]) =>
      HashMap.get(originStates, key).pipe(
        Option.match({
          onNone: () =>
            Either.left({
              entries: originEntries satisfies AnyEntry<Classes>[],
              key,
            }),
          onSome: (origin) =>
            Either.right({
              entries: originEntries satisfies AnyEntry<Classes>[],
              origin,
            }),
        })
      )
    )
  )
  return DeferredActionWriter.of(
    matched,
    unmatched.flatMap(({ key, entries: originEntries }) =>
      originEntries.map((entry) =>
        failEntry(entry, new UnhandledError({ message: `No origin found for URL ${key}` }))
      )
    )
  )
}

/**
 * Groups origins by state using {@link Origin.match}, producing named
 * `{ ready, loading, errored }` buckets. Ready groups pass through as the
 * value. Loading origins are awaited via {@link awaitOriginReady} and
 * dispatched to their resolver once settled. Errored origins fail their
 * entries immediately.
 */
export const filterReadyOrigins = <Classes extends Resource.AnyDomainClass>(
  resolverGroups: readonly {
    origin: Origin.AnyState<never>
    entries: AnyEntry<Classes>[]
  }[],
  stateChanges: Stream.Stream<Either.Either<HubState, HubError>>
): DeferredActionWriter.DeferredActionWriter<
  readonly {
    origin: Origin.Ready<never>
    entries: AnyEntry<Classes>[]
  }[]
> => {
  const { ready, loading, errored } = resolverGroups.reduce(
    (acc, { origin, entries }) => {
      Origin.match(origin, {
        onErrored: (o) => acc.errored.push({ origin: o, entries }),
        onLoading: (o) => acc.loading.push({ origin: o, entries }),
        onReady: (o) => acc.ready.push({ origin: o, entries }),
      })
      return acc
    },
    {
      errored: [] as {
        origin: Origin.Errored<never>
        entries: AnyEntry<Classes>[]
      }[],
      loading: [] as {
        origin: Origin.Loading<never>
        entries: AnyEntry<Classes>[]
      }[],
      ready: [] as {
        origin: Origin.Ready<never>
        entries: AnyEntry<Classes>[]
      }[],
    }
  )

  const loadingActions = loading.map(({ origin, entries }) =>
    pipe(
      awaitOriginReady(stateChanges, origin.originUrl.toString()),
      Effect.matchEffect({
        onFailure: (error) =>
          Effect.all(
            entries.map((entry) => failEntry(error)(entry)),
            {
              concurrency: 'unbounded',
            }
          ).pipe(Effect.asVoid),
        onSuccess: (readyOrigin) =>
          Effect.all(dispatchGroupToResolver(readyOrigin, entries), {
            concurrency: 'unbounded',
          }).pipe(Effect.asVoid),
      })
    )
  )

  const errorActions = errored.flatMap(({ origin, entries }) =>
    entries.map((entry) => failEntry(origin.errorStatus)(entry))
  )

  return DeferredActionWriter.of(ready, [...loadingActions, ...errorActions])
}

/**
 * Validate domainType support and dispatch a group of entries to a single
 * ready origin's resolver. Entries whose domainType the origin does not
 * support are failed with UnhandledError.
 */
export const dispatchGroupToResolver = <Classes extends Resource.AnyDomainClass>(
  origin: Origin.Ready<never>,
  entries: AnyEntry<Classes>[]
): readonly DeferredActionWriter.Action[] => {
  const [unsupported, valid] = pipe(
    entries,
    Array.partition((entry) => Origin.supports(origin, entry.request.klass))
  )

  const failActions = unsupported.map((entry) =>
    failEntry(
      entry,
      new UnhandledError({
        message: `Origin at ${origin.originUrl.toString()} doesn't support resource type ${String(entry.request.klass.DomainType)}`,
      })
    )
  )

  if (valid.length === 0) {
    return failActions
  }

  // Safe: guarded by Origin.supports above
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const resolver = origin.resolver as RequestResolver.RequestResolver<AnyRequest<Classes>>
  return [...failActions, resolver.runAll([valid] as const)]
}

/**
 * Dispatches all ready origin groups to their resolvers via
 * {@link dispatchGroupToResolver}, collecting the resulting actions.
 */
export const dispatchToResolvers = <Classes extends Resource.AnyDomainClass>(
  resolverGroups: readonly {
    origin: Origin.Ready<never>
    entries: AnyEntry<Classes>[]
  }[]
): DeferredActionWriter.DeferredActionWriter<void> =>
  DeferredActionWriter.of<void>(
    undefined,
    resolverGroups.flatMap(({ origin, entries }) => dispatchGroupToResolver(origin, entries))
  )

/**
 * Executes a single search across all origins that support the requested
 * resource type, merging results into a flat array.
 *
 * @remarks
 * Uses all-or-nothing semantics: if any origin is in a permanent error
 * state, the entire search fails. This prevents partial results from
 * causing incorrect downstream decisions (e.g. "no patients found" when a
 * FHIR store is unreachable). Callers wanting partial results should
 * pre-filter origins.
 */
export const fanOutSearch = <Classes extends Resource.AnyDomainClass>(
  searchRequest: ResourceRequest.Search<Classes>,
  originStates: HubState,
  stateChanges: Stream.Stream<Either.Either<HubState, HubError>>
): Effect.Effect<
  readonly Resource.WithResourceUrl<InstanceType<Classes>>[],
  ResourceRequest.CommonErrors
> => {
  const relevantOrigins = [...HashMap.values(originStates)].filter((o) =>
    Boolean(o.supportedResources[searchRequest.klass.DomainType])
  )

  if (relevantOrigins.length === 0) {
    return Effect.fail(
      new UnhandledError({
        message: `No origins found for resource type ${String(searchRequest.klass.DomainType)}`,
      })
    )
  }

  const makeSearchEffect = (
    readyOrigin: Origin.Ready<never>
  ): Effect.Effect<
    readonly Resource.WithResourceUrl<InstanceType<Classes>>[],
    ResourceRequest.CommonErrors
  > => {
    // Safe: caller ensures this origin supports the resource type
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const resolver = readyOrigin.resolver as RequestResolver.RequestResolver<
      ResourceRequest.Search<Classes>
    >
    // Each sub-search creates a fresh Request identity intentionally —
    // Every origin must execute its own search independently; re-using
    // Request instances across origins would silently drop results.
    return Effect.request(
      EffectRequest.of<ResourceRequest.Search<Classes>>()({
        _tag: 'Search',
        klass: searchRequest.klass,
        origin: readyOrigin.originUrl,
        params: searchRequest.params,
      }),
      resolver
    )
  }

  const subSearches = relevantOrigins.map((origin) =>
    Origin.match(origin, {
      onErrored: (o) => Effect.fail<ResourceRequest.CommonErrors>(o.errorStatus),
      onLoading: (o) =>
        pipe(
          awaitOriginReady(stateChanges, o.originUrl.toString()),
          Effect.flatMap(makeSearchEffect)
        ),
      onReady: makeSearchEffect,
    })
  )

  return Effect.all(subSearches, { concurrency: 'unbounded' }).pipe(
    Effect.map((results) => results.flat())
  )
}
