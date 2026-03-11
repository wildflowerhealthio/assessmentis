import type { RequestResolver, Stream } from 'effect'
import {
  Array,
  Effect,
  Request as EffectRequest,
  Either,
  HashMap,
  Option,
  pipe,
  Record,
} from 'effect'

import { UnhandledError } from '@assessmentis/ontology'
import { SideEffect } from '@assessmentis/util'

import * as Origin from '../Origin'
import type * as Resource from '../Resource'
import type * as ResourceRequest from '../ResourceRequest'

import {
  failEntry,
  type AnyEntry,
  type AnyRequest,
  type HubError,
  type HubState,
  type OriginBoundEntry,
} from './types'
import { awaitOriginReady } from './origin-resolution'

// --- Resolver pipeline ---

/**
 * Separates global searches (origin `null`) from origin-bound entries.
 * Global searches are resolved via {@link fanOutSearch} to all matching
 * origins; the remaining entries pass through unchanged.
 */
export const fanOutSearches = <Resources extends Resource.ResourceSet>(
  entries: ReadonlyArray<AnyEntry<Resources>>,
  originStates: HubState<Resources>,
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>
): SideEffect.SideEffect<ReadonlyArray<OriginBoundEntry<Resources>>> => {
  const globalSearches = entries.filter(
    (
      entry
    ): entry is EffectRequest.Entry<
      ResourceRequest.Search<Resources[keyof Resources]> & {
        readonly origin: null
      }
    > => entry.request._tag === 'Search' && entry.request.origin === null
  )
  const otherEntries = entries.filter(
    (entry): entry is OriginBoundEntry<Resources> =>
      entry.request._tag != 'Search' || entry.request.origin != null
  )

  const searchActions = globalSearches.map((entry) =>
    EffectRequest.completeEffect(
      entry.request,
      fanOutSearch(entry.request, originStates, stateChanges)
    )
  )
  return SideEffect.of(otherEntries, searchActions)
}

/**
 * Groups origin-bound entries by their `origin` URL, pairing each group with
 * its origin state. Entries whose origin URL has no matching state
 * are failed with `UnhandledError`.
 */
export const groupByOrigin = <Resources extends Resource.ResourceSet>(
  entries: ReadonlyArray<OriginBoundEntry<Resources>>,
  originStates: HubState<Resources>
): SideEffect.SideEffect<
  ReadonlyArray<{
    origin: Origin.AnyState<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
> => {
  const grouped = Array.groupBy(entries, (entry) =>
    entry.request.origin.toString()
  )
  const [unmatched, matched] = pipe(
    Record.toEntries(grouped),
    Array.partitionMap(([key, originEntries]) =>
      HashMap.get(originStates, key).pipe(
        Option.match({
          onNone: () =>
            Either.left({
              key,
              entries: originEntries satisfies AnyEntry<Resources>[],
            }),
          onSome: (origin) =>
            Either.right({
              origin,
              entries: originEntries satisfies AnyEntry<Resources>[],
            }),
        })
      )
    )
  )
  return SideEffect.of(
    matched,
    unmatched.flatMap(({ key, entries: originEntries }) =>
      originEntries.map((entry) =>
        failEntry(
          entry,
          new UnhandledError({ message: `No origin found for URL ${key}` })
        )
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
export const filterReadyOrigins = <Resources extends Resource.ResourceSet>(
  resolverGroups: ReadonlyArray<{
    origin: Origin.AnyState<Resources, never>
    entries: AnyEntry<Resources>[]
  }>,
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>
): SideEffect.SideEffect<
  ReadonlyArray<{
    origin: Origin.Ready<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
> => {
  const { ready, loading, errored } = resolverGroups.reduce(
    (acc, { origin, entries }) => {
      Origin.match(origin, {
        onReady: (o) => acc.ready.push({ origin: o, entries }),
        onLoading: (o) => acc.loading.push({ origin: o, entries }),
        onErrored: (o) => acc.errored.push({ origin: o, entries }),
      })
      return acc
    },
    {
      ready: [] as {
        origin: Origin.Ready<Resources, never>
        entries: AnyEntry<Resources>[]
      }[],
      loading: [] as {
        origin: Origin.Loading<Resources, never>
        entries: AnyEntry<Resources>[]
      }[],
      errored: [] as {
        origin: Origin.Errored<Resources, never>
        entries: AnyEntry<Resources>[]
      }[],
    }
  )

  const loadingActions = loading.map(({ origin, entries }) =>
    pipe(
      awaitOriginReady(stateChanges, origin.originUrl.toString()),
      Effect.matchEffect({
        onFailure: (error) =>
          Effect.all(entries.map(failEntry(error)), {
            concurrency: 'unbounded',
          }).pipe(Effect.asVoid),
        onSuccess: (readyOrigin) =>
          Effect.all(dispatchGroupToResolver(readyOrigin, entries), {
            concurrency: 'unbounded',
          }).pipe(Effect.asVoid),
      })
    )
  )

  const errorActions = errored.flatMap(({ origin, entries }) =>
    entries.map(failEntry(origin.errorStatus))
  )

  return SideEffect.of(ready, [...loadingActions, ...errorActions])
}

/**
 * Validate domainType support and dispatch a group of entries to a single
 * ready origin's resolver. Entries whose domainType the origin does not
 * support are failed with UnhandledError.
 */
export const dispatchGroupToResolver = <Resources extends Resource.ResourceSet>(
  origin: Origin.Ready<Resources, never>,
  entries: AnyEntry<Resources>[]
): ReadonlyArray<SideEffect.EffectAction> => {
  const [unsupported, valid] = pipe(
    entries,
    Array.partition((entry) =>
      Origin.supports(origin, entry.request.domainType)
    )
  )

  const failActions = unsupported.map((entry) =>
    failEntry(
      entry,
      new UnhandledError({
        message: `Origin at ${origin.originUrl.toString()} doesn't support resource type ${String(entry.request.domainType)}`,
      })
    )
  )

  if (valid.length === 0) return failActions

  // Safe: guarded by Origin.supports above
  const resolver = origin.resolver as RequestResolver.RequestResolver<
    AnyRequest<Resources>,
    never
  >
  return [...failActions, resolver.runAll([valid] as const)]
}

/**
 * Dispatches all ready origin groups to their resolvers via
 * {@link dispatchGroupToResolver}, collecting the resulting actions.
 */
export const dispatchToResolvers = <Resources extends Resource.ResourceSet>(
  resolverGroups: ReadonlyArray<{
    origin: Origin.Ready<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
): SideEffect.SideEffect<void> =>
  SideEffect.of<void>(
    undefined,
    resolverGroups.flatMap(({ origin, entries }) =>
      dispatchGroupToResolver(origin, entries)
    )
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
export const fanOutSearch = <Resources extends Resource.ResourceSet>(
  searchRequest: ResourceRequest.Search<Resources[keyof Resources]>,
  originStates: HubState<Resources>,
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>
): Effect.Effect<
  ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
  ResourceRequest.CommonErrors
> => {
  const relevantOrigins = [...HashMap.values(originStates)].filter(
    (o) => o.supportedResources[searchRequest.domainType]
  )

  if (relevantOrigins.length === 0) {
    return Effect.fail(
      new UnhandledError({
        message: `No origins found for resource type ${String(searchRequest.domainType)}`,
      })
    )
  }

  const makeSearchEffect = (
    readyOrigin: Origin.Ready<Resources, never>
  ): Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
    ResourceRequest.CommonErrors
  > => {
    // Safe: caller ensures this origin supports the resource type
    const resolver = readyOrigin.resolver as RequestResolver.RequestResolver<
      ResourceRequest.Search<Resources[keyof Resources]>,
      never
    >
    return Effect.request(
      EffectRequest.of<ResourceRequest.Search<Resources[keyof Resources]>>()({
        _tag: 'Search',
        domainType: searchRequest.domainType,
        params: searchRequest.params,
        origin: readyOrigin.originUrl,
      }),
      resolver
    )
  }

  const subSearches = relevantOrigins.map((origin) =>
    Origin.match(origin, {
      onReady: makeSearchEffect,
      onLoading: (o) =>
        pipe(
          awaitOriginReady(stateChanges, o.originUrl.toString()),
          Effect.flatMap(makeSearchEffect)
        ),
      onErrored: (o) =>
        Effect.fail<ResourceRequest.CommonErrors>(o.errorStatus),
    })
  )

  return Effect.all(subSearches, { concurrency: 'unbounded' }).pipe(
    Effect.map((results) => results.flat())
  )
}
