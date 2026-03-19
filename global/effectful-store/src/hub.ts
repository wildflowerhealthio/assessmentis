import { Effect, Either, RequestResolver, Stream, SubscriptionRef, pipe } from 'effect'
import type { Scope } from 'effect'

import { Loading } from '@assessmentis/ontology'
import { DeferredActionWriter } from '@assessmentis/util'

import type * as Resource from './resource'

import { awaitReady } from './hub/origin-resolution'
import {
  dispatchToResolvers,
  fanOutSearches,
  filterReadyOrigins,
  groupByOrigin,
} from './hub/pipeline'
import { makeRepository } from './hub/repository'
import { failEntry } from './hub/types'
import type {
  AnyEntry,
  AnyRequest,
  HubRef,
  HubError as _HubError,
  HubState as _HubState,
  Repository as _Repository,
} from './hub/types'

// --- Re-exports ---

export type { HubError, HubState, ResourceMethods, Repository } from './hub/types'

// --- Hub type ---

/**
 * A multi-origin resource store. Combines a reactive `changes` stream, a
 * batched `RequestResolver`, and typed {@link Repository} CRUD methods for
 * each resource type.
 *
 * @typeParam Classes - Union of domain classes this hub manages
 */
export type Hub<Classes extends Resource.AnyDomainClass = Resource.AnyDomainClass> = {
  readonly changes: Stream.Stream<Either.Either<_HubState, _HubError>>
  readonly resolver: RequestResolver.RequestResolver<AnyRequest<Classes>>
} & _Repository<Classes>

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
export const makeHubFromRef = <Classes extends Resource.AnyDomainClass>(
  stateRef: HubRef
): Hub<Classes> => {
  const resolver: RequestResolver.RequestResolver<AnyRequest<Resource.AnyDomainClass>> =
    RequestResolver.makeWithEntry((batches) =>
      Effect.gen(function* resolveRequests() {
        for (const batch of batches) {
          const stateResult = yield* Effect.either(awaitReady(stateRef))

          if (Either.isLeft(stateResult)) {
            yield* Effect.all(
              batch.map((entry) => failEntry(stateResult.left)(entry)),
              {
                concurrency: 'unbounded',
              }
            ).pipe(Effect.asVoid)
            continue
          }

          const originStates = stateResult.right

          yield* pipe(
            DeferredActionWriter.of<readonly AnyEntry<Resource.AnyDomainClass>[]>(batch, []),
            DeferredActionWriter.flatMap((entries) =>
              fanOutSearches(entries, originStates, stateRef.changes)
            ),
            DeferredActionWriter.flatMap((entries) => groupByOrigin(entries, originStates)),
            DeferredActionWriter.flatMap((groups) => filterReadyOrigins(groups, stateRef.changes)),
            DeferredActionWriter.flatMap((groups) => dispatchToResolvers(groups)),
            DeferredActionWriter.justActions,
            (actions) =>
              Effect.all(actions, {
                concurrency: 'unbounded',
              }),
            Effect.asVoid
          )
        }
      })
    )

  const repositoryImpl = makeRepository<Classes>(stateRef, resolver)

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
export const makeHub = <Classes extends Resource.AnyDomainClass>(
  stateStream: Stream.Stream<Either.Either<_HubState, _HubError>, never, Scope.Scope>
): Effect.Effect<Hub<Classes>, never, Scope.Scope> =>
  Effect.gen(function* makeHubGen() {
    const stateRef = yield* SubscriptionRef.make<Either.Either<_HubState, _HubError>>(
      Either.left(new Loading({ entity: 'Hub' } as const))
    )

    yield* stateStream.pipe(
      Stream.runForEach((state) => SubscriptionRef.set(stateRef, state)),
      Effect.forkScoped
    )

    return makeHubFromRef(stateRef)
  })
