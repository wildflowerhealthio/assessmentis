import {
  Effect,
  Either,
  pipe,
  RequestResolver,
  Stream,
  SubscriptionRef,
  type Scope,
} from 'effect'

import { Loading } from '@assessmentis/ontology'
import { SideEffect } from '@assessmentis/util'

import type * as Resource from './Resource'

import {
  failEntry,
  type AnyEntry,
  type AnyRequest,
  type HubError as _HubError,
  type HubRef,
  type HubState as _HubState,
  type Repository as _Repository,
} from './hub/types'
import { awaitReady } from './hub/origin-resolution'
import {
  dispatchToResolvers,
  fanOutSearches,
  filterReadyOrigins,
  groupByOrigin,
} from './hub/pipeline'
import { makeRepository } from './hub/repository'

// --- Re-exports ---

export type {
  HubError,
  HubState,
  ResourceMethods,
  Repository,
} from './hub/types'

// --- Hub type ---

/**
 * A multi-origin resource store. Combines a reactive `changes` stream, a
 * batched `RequestResolver`, and typed {@link Repository} CRUD methods for
 * each resource type.
 *
 * @typeParam Resources - Map of domain type keys to resource types
 */
export type Hub<Resources extends Resource.ResourceSet> = {
  readonly changes: Stream.Stream<
    Either.Either<_HubState<Resources>, _HubError>
  >
  readonly resolver: RequestResolver.RequestResolver<
    AnyRequest<Resources>,
    never
  >
} & _Repository<Resources>

// --- makeHub ---

/**
 * Builds a {@link Hub} from a pre-existing `SubscriptionRef`. The caller
 * owns the ref's lifecycle — no fibers are forked internally.
 *
 * @remarks
 * The resolver processes request batches through a pipeline:
 * fan-out searches, group by origin, filter ready origins, dispatch to
 * per-origin resolvers. Loading origins are deferred; permanent errors
 * fail immediately.
 */
export const makeHubFromRef = <Resources extends Resource.ResourceSet>(
  stateRef: HubRef<Resources>
): Hub<Resources> => {
  const resolver: RequestResolver.RequestResolver<
    AnyRequest<Resources>,
    never
  > = RequestResolver.makeWithEntry((batches) =>
    Effect.gen(function* () {
      for (const batch of batches) {
        const stateResult = yield* Effect.either(awaitReady(stateRef))

        if (Either.isLeft(stateResult)) {
          yield* Effect.all(batch.map(failEntry(stateResult.left)), {
            concurrency: 'unbounded',
          }).pipe(Effect.asVoid)
          continue
        }

        const originStates = stateResult.right

        yield* pipe(
          SideEffect.of<ReadonlyArray<AnyEntry<Resources>>>(batch, []),
          SideEffect.flatMap((entries) =>
            fanOutSearches(entries, originStates, stateRef.changes)
          ),
          SideEffect.flatMap((entries) => groupByOrigin(entries, originStates)),
          SideEffect.flatMap((groups) =>
            filterReadyOrigins(groups, stateRef.changes)
          ),
          SideEffect.flatMap((groups) => dispatchToResolvers(groups)),
          SideEffect.justActions,
          (actions) =>
            Effect.all(actions, {
              concurrency: 'unbounded',
            }),
          Effect.asVoid
        )
      }
    })
  )

  const repositoryImpl = makeRepository<Resources>(stateRef, resolver)

  return {
    changes: stateRef.changes,
    resolver,
    ...repositoryImpl,
  }
}

/**
 * Builds a {@link Hub} driven by a state stream. Forks a scoped fiber to
 * consume the stream into an internal `SubscriptionRef`, so the Hub stays
 * up-to-date as long as the enclosing `Scope` is open.
 */
export const makeHub = <Resources extends Resource.ResourceSet>(
  stateStream: Stream.Stream<
    Either.Either<_HubState<Resources>, _HubError>,
    never,
    Scope.Scope
  >
): Effect.Effect<Hub<Resources>, never, Scope.Scope> =>
  Effect.gen(function* () {
    const stateRef = yield* SubscriptionRef.make<
      Either.Either<_HubState<Resources>, _HubError>
    >(Either.left(new Loading({ entity: 'Hub' } as const)))

    yield* stateStream.pipe(
      Stream.runForEach((state) => SubscriptionRef.set(stateRef, state)),
      Effect.forkScoped
    )

    return makeHubFromRef(stateRef)
  })
