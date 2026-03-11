import {
  Array,
  Effect,
  Either,
  HashMap,
  Iterable,
  Option,
  pipe,
  Predicate,
  Stream,
  SubscriptionRef,
} from 'effect'

import type { Loading } from '@assessmentis/ontology'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

import {
  originIsNotLoading,
  type NotReadyOrigin,
  type OriginState,
  type ReadyOrigin,
  type ResourcesConstraint,
} from '../OriginState'
import type { ReadonlyUrl } from '../ReadonlyUrl'
import type * as ResourceRequest from '../ResourceRequest'

import {
  LOADING_TIMEOUT,
  type HubError,
  type HubRef,
  type HubState,
} from './types'

// --- Origin readiness ---

/**
 * Watch the Hub's changes stream for a specific origin to leave the Loading
 * state. Resolves with the ReadyOrigin when it becomes available, or fails
 * with the origin's permanent error. Times out with UnhandledError after
 * LOADING_TIMEOUT.
 *
 * Designed as a reusable primitive: any pipeline stage that encounters a
 * Loading origin can defer work through this utility rather than failing
 * eagerly.
 */
export const awaitOriginReady = <Resources extends ResourcesConstraint>(
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>,
  originUrl: string
): Effect.Effect<ReadyOrigin<Resources, never>, ResourceRequest.CommonErrors> =>
  pipe(
    stateChanges,
    Stream.filterMap(Either.getRight),
    Stream.filterMap(HashMap.get(originUrl)),
    Stream.filter(originIsNotLoading),
    Stream.runHead,
    Effect.timeoutFail({
      duration: LOADING_TIMEOUT,
      onTimeout: () =>
        new UnhandledError({
          message: `Origin at ${originUrl} timed out while loading`,
        }),
    }),
    Effect.flatMap(
      Effect.mapError(
        () =>
          new UnhandledError({
            message: `Origin at ${originUrl} was removed while loading`,
          })
      )
    ),
    Effect.filterOrFail(
      (origin) => origin.errorStatus === undefined,
      (origin) => origin.errorStatus!
    )
  )

// --- State access ---

/**
 * Wait for the Hub to have a ready state. Loading defers until a value or
 * error arrives. Non-Loading errors are returned immediately.
 */
export const awaitReady = <Resources extends ResourcesConstraint>(
  stateRef: HubRef<Resources>
): Effect.Effect<HubState<Resources>, ResourceRequest.CommonErrors> =>
  Effect.flatMap(SubscriptionRef.get(stateRef), (current) => {
    if (Either.isRight(current)) return Effect.succeed(current.right)
    const error = current.left
    if (error._tag !== 'Loading') return Effect.fail(error)
    return stateRef.changes.pipe(
      Stream.filter(
        (
          e
        ): e is Either.Either<
          HubState<Resources>,
          ResourceRequest.CommonErrors
        > => !(Either.isLeft(e) && e.left._tag === 'Loading')
      ),
      Stream.runHead,
      Effect.flatMap(
        Effect.mapError(
          () =>
            new UnhandledError({
              message: 'Hub stream ended while loading',
            })
        )
      ),
      Effect.flatten
    )
  })

// --- Origin inference ---

export const resolveOriginFromUrl = <
  Resources extends ResourcesConstraint,
  K extends string,
>(
  stateRef: HubRef<Resources>,
  url: ReadonlyUrl,
  domainType: K
): Effect.Effect<
  ReadonlyUrl,
  NotFoundError<K, { url: ReadonlyUrl }> | ResourceRequest.CommonErrors
> =>
  pipe(
    awaitReady(stateRef),
    Effect.map((states) =>
      pipe(
        HashMap.values(states),
        Iterable.filter((o) => o.originUrl.hasChild(url)),
        Iterable.map((o) => o.originUrl),
        Array.fromIterable
      )
    ),
    Effect.filterOrFail(
      Predicate.isTupleOfAtLeast(1),
      () => new NotFoundError({ resourceType: domainType, params: { url } })
    ),
    Effect.filterOrFail(
      Predicate.isTupleOf(1),
      (matches) =>
        new UnhandledError({
          message: `Ambiguous origin for URL ${url.toString()}: ${matches.length} origins match`,
        })
    ),
    Effect.map(([match]) => match)
  )

export const resolveOriginForCreate = <Resources extends ResourcesConstraint>(
  stateRef: HubRef<Resources>,
  domainType: keyof Resources & string,
  explicitOrigin: ReadonlyUrl | undefined
): Effect.Effect<ReadonlyUrl, ResourceRequest.CommonErrors> =>
  explicitOrigin
    ? Effect.succeed(explicitOrigin)
    : pipe(
        awaitReady(stateRef),
        Effect.map((states) =>
          pipe(
            HashMap.values(states),
            Iterable.filter((o) => o.activeResources[domainType]),
            Iterable.map((o) => o.originUrl),
            Array.fromIterable
          )
        ),
        Effect.filterOrFail(
          Predicate.isTupleOfAtLeast(1),
          () =>
            new UnhandledError({
              message: `No origins found for resource type ${domainType}`,
            })
        ),
        Effect.filterOrFail(
          Predicate.isTupleOf(1),
          (matches) =>
            new UnhandledError({
              message: `Ambiguous origin for resource type ${domainType}: ${matches.length} origins match`,
            })
        ),
        Effect.map(([match]) => match)
      )
