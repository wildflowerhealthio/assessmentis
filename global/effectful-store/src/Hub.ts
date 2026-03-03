import {
  Array,
  SubscriptionRef,
  Effect,
  RequestResolver,
  Record,
  Deferred,
  pipe,
} from 'effect'
import { Request as EffectRequest } from 'effect'
import { type Stream } from 'effect'

import { UnhandledError } from '@assessmentis/ontology'
import type * as Resource from './Resource'
import { type ResourcesConstraint, originCanResolve } from './OriginState'
import type { OriginState, ReadyOrigin } from './OriginState'
import type * as ResourceRequest from './ResourceRequest'
import type { ReadonlyUrl } from './ReadonlyUrl'
import { SideEffect } from '@assessmentis/util'

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

// --- Hub ---

export type HubState<Resources extends ResourcesConstraint> = ReadonlyMap<
  string,
  OriginState<Resources, never>
>

export class Hub<const Resources extends ResourcesConstraint> {
  constructor(
    private readonly originStatesRef: SubscriptionRef.SubscriptionRef<
      HubState<Resources>
    >
  ) {}

  get changes(): Stream.Stream<HubState<Resources>> {
    return this.originStatesRef.changes
  }

  setOriginState<ActiveResources extends keyof Resources>(
    origin: OriginState<Resources, ActiveResources>
  ): Effect.Effect<void, never, never> {
    return SubscriptionRef.update(this.originStatesRef, (originState) => {
      const next = new Map(originState)
      next.set(origin.originUrl.toString(), origin)
      return next
    })
  }

  deregisterOrigin(originUrl: ReadonlyUrl): Effect.Effect<void> {
    return SubscriptionRef.update(this.originStatesRef, (originState) => {
      const next = new Map(originState)
      next.delete(originUrl.toString())
      return next
    })
  }

  // --- Resolver pipeline ---

  readonly resolver: RequestResolver.RequestResolver<
    AnyRequest<Resources>,
    never
  > = RequestResolver.makeWithEntry((batches) =>
    Effect.gen(this, function* () {
      for (const batch of batches) {
        const originStates = yield* SubscriptionRef.get(this.originStatesRef)

        const { actions } = pipe(
          SideEffect.of<ReadonlyArray<AnyEntry<Resources>>>(batch, []),
          SideEffect.flatMap((entries) =>
            this.fanOutSearches(entries, originStates)
          ),
          SideEffect.flatMap((entries) =>
            this.groupByOrigin(entries, originStates)
          ),
          SideEffect.flatMap((groups) => this.filterReadyOrigins(groups)),
          SideEffect.flatMap((groups) => this.dispatchToResolvers(groups))
        )

        yield* Effect.all(actions, {
          concurrency: 'unbounded',
        }).pipe(Effect.asVoid)
      }
    })
  )

  private fanOutSearches(
    entries: ReadonlyArray<AnyEntry<Resources>>,
    originStates: HubState<Resources>
  ): SideEffect.SideEffect<ReadonlyArray<OriginBoundEntry<Resources>>> {
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
        this.fanOutSearch(entry.request, originStates)
      )
    )
    return SideEffect.of(otherEntries, searchActions)
  }

  private groupByOrigin(
    entries: ReadonlyArray<OriginBoundEntry<Resources>>,
    originStates: HubState<Resources>
  ): SideEffect.SideEffect<
    ReadonlyArray<{
      origin: OriginState<Resources, never>
      entries: AnyEntry<Resources>[]
    }>
  > {
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

  private filterReadyOrigins(
    resolverGroups: ReadonlyArray<{
      origin: OriginState<Resources, never>
      entries: AnyEntry<Resources>[]
    }>
  ): SideEffect.SideEffect<
    ReadonlyArray<{
      origin: ReadyOrigin<Resources, never>
      entries: AnyEntry<Resources>[]
    }>
  > {
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

  private dispatchToResolvers(
    resolverGroups: ReadonlyArray<{
      origin: ReadyOrigin<Resources, never>
      entries: AnyEntry<Resources>[]
    }>
  ): SideEffect.SideEffect<void> {
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

  // --- Private helpers ---

  fanOutSearch(
    searchRequest: ResourceRequest.Search<Resources[keyof Resources]>,
    originStates: HubState<Resources>
  ): Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<Resources[keyof Resources]>>,
    ResourceRequest.CommonErrors
  > {
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
          EffectRequest.of<
            ResourceRequest.Search<Resources[keyof Resources]>
          >()({
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
}

export const makeHub = <Resources extends ResourcesConstraint>(): Effect.Effect<
  Hub<Resources>
> =>
  Effect.gen(function* () {
    const stateRef = yield* SubscriptionRef.make<HubState<Resources>>(new Map())
    return new Hub(stateRef)
  })
