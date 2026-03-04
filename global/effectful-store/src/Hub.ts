import {
  Array,
  Deferred,
  Effect,
  Request as EffectRequest,
  pipe,
  Record,
  RequestResolver,
  Stream,
  SubscriptionRef,
} from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { SideEffect, StreamEither } from '@assessmentis/util'

import {
  originCanResolve,
  type OriginState,
  type ReadyOrigin,
  type ResourcesConstraint,
} from './OriginState'
import type { ReadonlyUrl } from './ReadonlyUrl'
import type * as Resource from './Resource'
import type * as ResourceRequest from './ResourceRequest'

// --- Pipeline types ---

type AnyEntry<Resources extends ResourcesConstraint> = EffectRequest.Entry<
  | ResourceRequest.Get<Resources[keyof Resources]>
  | ResourceRequest.Search<Resources[keyof Resources]>
  | ResourceRequest.Create<Resources[keyof Resources]>
  | ResourceRequest.Update<Resources[keyof Resources]>
  | ResourceRequest.Delete<Resources[keyof Resources]>
>

type AnyRequest<Resources extends ResourcesConstraint> =
  | ResourceRequest.Get<Resources[keyof Resources]>
  | ResourceRequest.Search<Resources[keyof Resources]>
  | ResourceRequest.Create<Resources[keyof Resources]>
  | ResourceRequest.Update<Resources[keyof Resources]>
  | ResourceRequest.Delete<Resources[keyof Resources]>

type OriginBoundEntry<Resources extends ResourcesConstraint> =
  EffectRequest.Entry<
    | ResourceRequest.Get<Resources[keyof Resources]>
    | ResourceRequest.Create<Resources[keyof Resources]>
    | ResourceRequest.Update<Resources[keyof Resources]>
    | ResourceRequest.Delete<Resources[keyof Resources]>
    | (ResourceRequest.Search<Resources[keyof Resources]> & {
        readonly origin: ReadonlyUrl
      })
  >

const asEntryFailure = <Resources extends ResourcesConstraint>(
  entry: AnyEntry<Resources>,
  error: UnhandledError | ResourceRequest.CommonErrors
): SideEffect.EffectAction => Deferred.fail(entry.result, error)

// --- Hub type ---

export type HubState<Resources extends ResourcesConstraint> = ReadonlyMap<
  string,
  OriginState<Resources, never>
>

export type Hub<Resources extends ResourcesConstraint> = {
  readonly changes: Stream.Stream<HubState<Resources>>
  readonly setOriginState: <ActiveResources extends keyof Resources>(
    origin: OriginState<Resources, ActiveResources>
  ) => Effect.Effect<void, never, never>
  readonly deregisterOrigin: (originUrl: ReadonlyUrl) => Effect.Effect<void>
  readonly resolver: RequestResolver.RequestResolver<
    AnyRequest<Resources>,
    never
  >
} & HubResourceMethods<Resources>

type HubResourceMethods<Resources extends ResourcesConstraint> = {
  readonly [R in keyof Resources & string as `get${R}`]: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    Resource.WithResourceUrl<Resources[R]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[R]['domainType'],
        { url: Resource.InferResourceUrl<Resources[R]> }
      >,
    never
  >
} & {
  readonly [R in keyof Resources & string as `subscribe${R}`]: (
    url: ReadonlyUrl
  ) => StreamEither.StreamEither<
    Resource.WithResourceUrl<Resources[R]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[R]['domainType'],
        { url: Resource.InferResourceUrl<Resources[R]> }
      >,
    never
  >
} & {
  readonly [R in keyof Resources & string as `search${R}`]: (
    params?: ResourceRequest.SearchParam<Resources[R]>
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[R]>>,
    ResourceRequest.CommonErrors,
    never
  >
} & {
  readonly [R in keyof Resources & string as `subscribeSearch${R}`]: (
    params?: ResourceRequest.SearchParam<Resources[R]>
  ) => StreamEither.StreamEither<
    ReadonlyArray<Resource.WithResourceUrl<Resources[R]>>,
    ResourceRequest.CommonErrors,
    never
  >
} & {
  readonly [R in keyof Resources & string as `create${R}`]: (
    resource: Resources[R],
    origin?: ReadonlyUrl
  ) => Effect.Effect<
    Resource.WithResourceUrl<Resources[R]>,
    ResourceRequest.CommonErrors,
    never
  >
} & {
  readonly [R in keyof Resources & string as `createMany${R}`]: (
    resources: ReadonlyArray<Resources[R]>,
    origin?: ReadonlyUrl
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[R]>>,
    ResourceRequest.CommonErrors,
    never
  >
} & {
  readonly [R in keyof Resources & string as `update${R}`]: (
    resource: Resource.WithResourceUrl<Resources[R]>
  ) => Effect.Effect<
    Resource.WithResourceUrl<Resources[R]>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[R]['domainType'],
        { url: Resource.InferResourceUrl<Resources[R]> }
      >,
    never
  >
} & {
  readonly [R in keyof Resources & string as `delete${R}`]: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    void,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        Resources[R]['domainType'],
        { url: Resource.InferResourceUrl<Resources[R]> }
      >,
    never
  >
}

// --- Resolver pipeline ---

const fanOutSearches = <Resources extends ResourcesConstraint>(
  entries: ReadonlyArray<AnyEntry<Resources>>,
  originStates: HubState<Resources>,
  fanOutSearch: (
    searchRequest: ResourceRequest.Search<Resources[keyof Resources]>,
    originStates: HubState<Resources>
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
    ResourceRequest.CommonErrors
  >
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
      fanOutSearch(entry.request, originStates)
    )
  )
  return SideEffect.of(otherEntries, searchActions)
}

const groupByOrigin = <Resources extends ResourcesConstraint>(
  entries: ReadonlyArray<OriginBoundEntry<Resources>>,
  originStates: HubState<Resources>
): SideEffect.SideEffect<
  ReadonlyArray<{
    origin: OriginState<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
> => {
  const entriesByOrigin = Array.groupBy(
    entries,
    (entry) => entry.request.origin?.toString() ?? 'NO_ORIGIN'
  )
  const actions: SideEffect.EffectAction[] = []
  const resolverGroups: {
    origin: OriginState<Resources, never>
    entries: AnyEntry<Resources>[]
  }[] = []
  for (const [key, group] of Record.toEntries(entriesByOrigin)) {
    const origin = originStates.get(key) ?? null
    if (origin) {
      resolverGroups.push({ origin, entries: group })
    } else {
      for (const entry of group) {
        actions.push(
          asEntryFailure(
            entry,
            new UnhandledError({
              message: `No origin found for URL ${key}`,
            })
          )
        )
      }
    }
  }
  return SideEffect.of(resolverGroups, actions)
}

const filterReadyOrigins = <Resources extends ResourcesConstraint>(
  resolverGroups: ReadonlyArray<{
    origin: OriginState<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
): SideEffect.SideEffect<
  ReadonlyArray<{
    origin: ReadyOrigin<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
> => {
  const actions: SideEffect.EffectAction[] = []
  const readyGroups: {
    origin: ReadyOrigin<Resources, never>
    entries: AnyEntry<Resources>[]
  }[] = []

  for (const { origin, entries } of resolverGroups) {
    if (origin.errorStatus) {
      for (const entry of entries) {
        actions.push(
          asEntryFailure(
            entry,
            origin.errorStatus._tag === 'Loading'
              ? new UnhandledError({
                  message: `Origin at ${origin.originUrl.toString()} is still loading`,
                })
              : origin.errorStatus
          )
        )
      }
    } else {
      readyGroups.push({ origin, entries })
    }
  }

  return SideEffect.of(readyGroups, actions)
}

const dispatchToResolvers = <Resources extends ResourcesConstraint>(
  resolverGroups: ReadonlyArray<{
    origin: ReadyOrigin<Resources, never>
    entries: AnyEntry<Resources>[]
  }>
): SideEffect.SideEffect<void> => {
  const actions: SideEffect.EffectAction[] = []

  for (const { origin, entries } of resolverGroups) {
    const validEntries: AnyEntry<Resources>[] = []
    for (const entry of entries) {
      if (originCanResolve(origin, entry.request.domainType)) {
        validEntries.push(entry)
      } else {
        actions.push(
          asEntryFailure(
            entry,
            new UnhandledError({
              message: `Origin at ${origin.originUrl.toString()} doesn't support resource type ${String(entry.request.domainType)}`,
            })
          )
        )
      }
    }

    if (validEntries.length > 0) {
      const resolver = origin.resolver as RequestResolver.RequestResolver<
        AnyRequest<Resources>,
        never
      >
      actions.push(resolver.runAll([validEntries] as const))
    }
  }

  return SideEffect.of<void>(undefined, actions)
}

const fanOutSearch = <Resources extends ResourcesConstraint>(
  searchRequest: ResourceRequest.Search<Resources[keyof Resources]>,
  originStates: HubState<Resources>
): Effect.Effect<
  ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
  ResourceRequest.CommonErrors
> => {
  const subSearches: Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
    ResourceRequest.CommonErrors
  >[] = []

  for (const origin of originStates.values()) {
    if (!origin.activeResources[searchRequest.domainType]) continue

    if (origin.errorStatus) {
      return Effect.fail(
        origin.errorStatus._tag === 'Loading'
          ? new UnhandledError({
              message: `Origin at ${origin.originUrl.toString()} is still loading`,
            })
          : origin.errorStatus
      )
    }

    const resolver = origin.resolver as RequestResolver.RequestResolver<
      ResourceRequest.Search<Resources[keyof Resources]>,
      never
    >

    subSearches.push(
      Effect.request(
        EffectRequest.of<ResourceRequest.Search<Resources[keyof Resources]>>()({
          _tag: 'Search',
          domainType: searchRequest.domainType,
          params: searchRequest.params,
          origin: origin.originUrl,
        }),
        resolver
      )
    )
  }

  if (subSearches.length === 0) {
    return Effect.fail(
      new UnhandledError({
        message: `No origins found for resource type ${String(searchRequest.domainType)}`,
      })
    )
  }

  return Effect.all(subSearches, { concurrency: 'unbounded' }).pipe(
    Effect.map((results) => results.flat())
  )
}

// --- Origin inference ---

const resolveOriginFromUrl = <
  Resources extends ResourcesConstraint,
  K extends string,
>(
  stateRef: SubscriptionRef.SubscriptionRef<HubState<Resources>>,
  url: ReadonlyUrl,
  domainType: K
): Effect.Effect<
  ReadonlyUrl,
  NotFoundError<K, { url: ReadonlyUrl }> | UnhandledError
> =>
  Effect.gen(function* () {
    const states = yield* SubscriptionRef.get(stateRef)
    let match: ReadonlyUrl | undefined
    let matchCount = 0
    for (const origin of states.values()) {
      if (origin.originUrl.hasChild(url)) {
        match = origin.originUrl
        matchCount++
      }
    }
    if (!match) {
      return yield* new NotFoundError({
        resourceType: domainType,
        params: { url },
      })
    }
    if (matchCount > 1) {
      return yield* new UnhandledError({
        message: `Ambiguous origin for URL ${url.toString()}: ${matchCount} origins match`,
      })
    }
    return match
  })

const resolveOriginForCreate = <Resources extends ResourcesConstraint>(
  stateRef: SubscriptionRef.SubscriptionRef<HubState<Resources>>,
  domainType: keyof Resources & string,
  explicitOrigin: ReadonlyUrl | undefined
): Effect.Effect<ReadonlyUrl, UnhandledError> =>
  explicitOrigin
    ? Effect.succeed(explicitOrigin)
    : Effect.gen(function* () {
        const states = yield* SubscriptionRef.get(stateRef)
        let match: ReadonlyUrl | undefined
        let matchCount = 0
        for (const origin of states.values()) {
          if (origin.activeResources[domainType]) {
            match = origin.originUrl
            matchCount++
          }
        }
        if (!match) {
          return yield* new UnhandledError({
            message: `No origins found for resource type ${domainType}`,
          })
        }
        if (matchCount > 1) {
          return yield* new UnhandledError({
            message: `Ambiguous origin for resource type ${domainType}: ${matchCount} origins match`,
          })
        }
        return match
      })

// --- Origin change detection ---

/**
 * Filters a HubState changes stream to only emit when relevant origins change.
 *
 * - `null` matches all origins that support `domainType` (for fan-out search)
 * - A specific URL matches origins whose `originUrl.hasChild(url)` (for get by URL)
 *
 * Uses reference equality on OriginState objects: a new emission passes through
 * only when the set of matching origins differs in length or identity.
 */
const whenOriginChanges = <Resources extends ResourcesConstraint>(
  stateChanges: Stream.Stream<HubState<Resources>>,
  domainType: keyof Resources & string,
  url: ReadonlyUrl | null
): Stream.Stream<HubState<Resources>> => {
  const selectRelevant = (state: HubState<Resources>) =>
    [...state.values()].filter((o) =>
      url === null ? o.activeResources[domainType] : o.originUrl.hasChild(url)
    )

  return pipe(
    stateChanges,
    Stream.changesWith((prev, next) => {
      const prevOrigins = selectRelevant(prev)
      const nextOrigins = selectRelevant(next)
      if (prevOrigins.length !== nextOrigins.length) return false
      return prevOrigins.every((o, i) => o === nextOrigins[i])
    })
  )
}

// --- Resource method builder ---

const makeResourceMethods = <
  Resources extends ResourcesConstraint,
  K extends keyof Resources & string,
>(
  domainType: K,
  stateRef: SubscriptionRef.SubscriptionRef<HubState<Resources>>,
  resolver: RequestResolver.RequestResolver<AnyRequest<Resources>, never>
): HubResourceMethods<Pick<Resources, K>> => {
  type T = Resources[K]

  return {
    [`get${domainType}`]: (url: ReadonlyUrl) =>
      Effect.flatMap(
        resolveOriginFromUrl(stateRef, url, domainType),
        (origin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Get<T>>()({
              _tag: 'Get',
              domainType,
              url,
              origin,
            }),
            resolver
          )
      ),

    [`search${domainType}`]: (params?: ResourceRequest.SearchParam<T>) =>
      Effect.request(
        EffectRequest.of<ResourceRequest.Search<T>>()({
          _tag: 'Search',
          domainType,
          params: params ?? {},
          origin: null,
        }),
        resolver
      ),

    [`create${domainType}`]: (resource: T, origin?: ReadonlyUrl) =>
      Effect.flatMap(
        resolveOriginForCreate(stateRef, domainType, origin),
        (resolvedOrigin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Create<T>>()({
              _tag: 'Create',
              domainType,
              resource,
              origin: resolvedOrigin,
            }),
            resolver
          )
      ),

    [`createMany${domainType}`]: (
      resources: ReadonlyArray<T>,
      origin?: ReadonlyUrl
    ) =>
      Effect.flatMap(
        resolveOriginForCreate(stateRef, domainType, origin),
        (resolvedOrigin) =>
          Effect.all(
            resources.map((resource) =>
              Effect.request(
                EffectRequest.of<ResourceRequest.Create<T>>()({
                  _tag: 'Create',
                  domainType,
                  resource,
                  origin: resolvedOrigin,
                }),
                resolver
              )
            ),
            { concurrency: 'unbounded' }
          )
      ),

    [`update${domainType}`]: (resource: Resource.WithResourceUrl<T>) =>
      Effect.flatMap(
        resolveOriginFromUrl(stateRef, resource.url, domainType),
        (origin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Update<T>>()({
              _tag: 'Update',
              domainType,
              resource,
              origin,
            }),
            resolver
          )
      ),

    [`delete${domainType}`]: (url: ReadonlyUrl) =>
      Effect.flatMap(
        resolveOriginFromUrl(stateRef, url, domainType),
        (origin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Delete<T>>()({
              _tag: 'Delete',
              domainType,
              resource: { url },
              origin,
            }),
            resolver
          ).pipe(Effect.asVoid)
      ),

    [`subscribe${domainType}`]: (url: ReadonlyUrl) =>
      pipe(
        whenOriginChanges(stateRef.changes, domainType, url),
        Stream.mapEffect(() =>
          Effect.either(
            Effect.flatMap(
              resolveOriginFromUrl(stateRef, url, domainType),
              (origin) =>
                Effect.request(
                  EffectRequest.of<ResourceRequest.Get<T>>()({
                    _tag: 'Get',
                    domainType,
                    url,
                    origin,
                  }),
                  resolver
                )
            )
          )
        )
      ),

    [`subscribeSearch${domainType}`]: (
      params?: ResourceRequest.SearchParam<T>
    ) =>
      pipe(
        whenOriginChanges(stateRef.changes, domainType, null),
        Stream.mapEffect(() =>
          Effect.either(
            Effect.request(
              EffectRequest.of<ResourceRequest.Search<T>>()({
                _tag: 'Search',
                domainType,
                params: params ?? {},
                origin: null,
              }),
              resolver
            )
          )
        )
      ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as const as any
}

// --- makeHub ---

// Justified cast: Object.assign dynamically adds resource methods whose
// names are computed from resourceKeys (e.g. getPatient, searchPatient).
// TypeScript cannot verify template-literal mapped types from dynamic
// property assignment.
export const makeHub = <Resources extends ResourcesConstraint>(
  resourceKeys: ReadonlyArray<keyof Resources & string>
): Effect.Effect<Hub<Resources>> =>
  Effect.gen(function* () {
    const stateRef = yield* SubscriptionRef.make<HubState<Resources>>(new Map())

    const resolver: RequestResolver.RequestResolver<
      AnyRequest<Resources>,
      never
    > = RequestResolver.makeWithEntry((batches) =>
      Effect.gen(function* () {
        for (const batch of batches) {
          const originStates = yield* SubscriptionRef.get(stateRef)

          const { actions } = pipe(
            SideEffect.of<ReadonlyArray<AnyEntry<Resources>>>(batch, []),
            SideEffect.flatMap((entries) =>
              fanOutSearches(entries, originStates, fanOutSearch)
            ),
            SideEffect.flatMap((entries) =>
              groupByOrigin(entries, originStates)
            ),
            SideEffect.flatMap((groups) => filterReadyOrigins(groups)),
            SideEffect.flatMap((groups) => dispatchToResolvers(groups))
          )

          yield* Effect.all(actions, {
            concurrency: 'unbounded',
          }).pipe(Effect.asVoid)
        }
      })
    )

    const hub = {
      changes: stateRef.changes,

      setOriginState: <ActiveResources extends keyof Resources>(
        origin: OriginState<Resources, ActiveResources>
      ): Effect.Effect<void, never, never> =>
        SubscriptionRef.update(stateRef, (originState) => {
          const next = new Map(originState)
          next.set(origin.originUrl.toString(), origin)
          return next
        }),

      deregisterOrigin: (originUrl: ReadonlyUrl): Effect.Effect<void> =>
        SubscriptionRef.update(stateRef, (originState) => {
          const next = new Map(originState)
          next.delete(originUrl.toString())
          return next
        }),

      resolver,
    }

    let methods = {}
    for (const key of resourceKeys) {
      methods = Object.assign(
        methods,
        makeResourceMethods(key, stateRef, resolver)
      )
    }

    return Object.assign(hub, methods) as Hub<Resources>
  })
