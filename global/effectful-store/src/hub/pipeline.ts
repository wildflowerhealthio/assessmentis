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

import {
  originCanResolve,
  type OriginState,
  type ReadyOrigin,
  type ResourcesConstraint,
} from '../OriginState'
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

export const fanOutSearches = <Resources extends ResourcesConstraint>(
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

export const groupByOrigin = <Resources extends ResourcesConstraint>(
  entries: ReadonlyArray<OriginBoundEntry<Resources>>,
  originStates: HubState<Resources>
): SideEffect.SideEffect<
  ReadonlyArray<{
    origin: OriginState<Resources, never>
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

export const filterReadyOrigins = <Resources extends ResourcesConstraint>(
  resolverGroups: ReadonlyArray<{
    origin: OriginState<Resources, never>
    entries: AnyEntry<Resources>[]
  }>,
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>
): SideEffect.SideEffect<
  ReadonlyArray<{
    origin: ReadyOrigin<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
> => {
  const [notReady, ready] = pipe(
    resolverGroups,
    Array.partitionMap(({ origin, entries }) =>
      origin.errorStatus === undefined
        ? Either.right({
            origin: origin,
            entries,
          })
        : Either.left({ errorStatus: origin.errorStatus, origin, entries })
    )
  )

  const actions = notReady.flatMap(({ errorStatus, origin, entries }) => {
    if (errorStatus._tag === 'Loading') {
      // Loading is transient — defer the request until the origin settles.
      // awaitOriginReady watches the changes stream and either dispatches
      // to the resolver once ready, or fails with the permanent error.
      return [
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
        ),
      ]
    }
    // Permanent error — fail immediately
    return entries.map(failEntry(errorStatus))
  })

  return SideEffect.of(ready, actions)
}

/**
 * Validate domainType support and dispatch a group of entries to a single
 * ready origin's resolver. Entries whose domainType the origin does not
 * support are failed with UnhandledError.
 */
export const dispatchGroupToResolver = <Resources extends ResourcesConstraint>(
  origin: ReadyOrigin<Resources, never>,
  entries: AnyEntry<Resources>[]
): ReadonlyArray<SideEffect.EffectAction> => {
  const [unsupported, valid] = pipe(
    entries,
    Array.partition((entry) =>
      originCanResolve(origin, entry.request.domainType)
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

  // Safe: guarded by originCanResolve above
  const resolver = origin.resolver as RequestResolver.RequestResolver<
    AnyRequest<Resources>,
    never
  >
  return [...failActions, resolver.runAll([valid] as const)]
}

export const dispatchToResolvers = <Resources extends ResourcesConstraint>(
  resolverGroups: ReadonlyArray<{
    origin: ReadyOrigin<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
): SideEffect.SideEffect<void> =>
  SideEffect.of<void>(
    undefined,
    resolverGroups.flatMap(({ origin, entries }) =>
      dispatchGroupToResolver(origin, entries)
    )
  )

export const fanOutSearch = <Resources extends ResourcesConstraint>(
  searchRequest: ResourceRequest.Search<Resources[keyof Resources]>,
  originStates: HubState<Resources>,
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>
): Effect.Effect<
  ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
  ResourceRequest.CommonErrors
> => {
  const relevantOrigins = [...HashMap.values(originStates)].filter(
    (o) => o.activeResources[searchRequest.domainType]
  )

  if (relevantOrigins.length === 0) {
    return Effect.fail(
      new UnhandledError({
        message: `No origins found for resource type ${String(searchRequest.domainType)}`,
      })
    )
  }

  const makeSearchEffect = (
    readyOrigin: ReadyOrigin<Resources, never>
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

  const subSearches = relevantOrigins.map((origin) => {
    if (!origin.errorStatus) {
      return makeSearchEffect(origin)
    }
    if (origin.errorStatus._tag === 'Loading') {
      // Loading is transient — wait for the origin to become ready,
      // then dispatch the search.
      return pipe(
        awaitOriginReady(stateChanges, origin.originUrl.toString()),
        Effect.flatMap(makeSearchEffect)
      )
    }
    // Permanent error (AuthError, AuthzError, UnhandledError) — fail the
    // entire fan-out search. This is intentional: we choose strict
    // consistency ("all-or-nothing") over partial results. A source in an
    // error state may have data the caller expects; silently omitting it
    // could cause incorrect downstream decisions (e.g. a UI showing
    // "no patients found" when a FHIR store is simply unreachable).
    // Callers who want partial results should filter origins before searching.
    return Effect.fail<ResourceRequest.CommonErrors>(origin.errorStatus)
  })

  return Effect.all(subSearches, { concurrency: 'unbounded' }).pipe(
    Effect.map((results) => results.flat())
  )
}
