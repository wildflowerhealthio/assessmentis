import {
  Array,
  Effect,
  Either,
  HashMap,
  Iterable,
  pipe,
  Predicate,
  Stream,
  SubscriptionRef,
} from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { isNotTagged, StreamEither } from '@assessmentis/util'

import type * as Resource from '../Resource'
import * as Origin from '../Origin'
import type { ReadonlyUrl } from '../ReadonlyUrl'
import type * as ResourceRequest from '../ResourceRequest'

import { LOADING_TIMEOUT } from './types'
import type { HubError, HubRef, HubState } from './types'

// --- Origin readiness ---

/**
 * Watch the Hub's changes stream for a specific origin to leave the Loading
 * state. Resolves with the Ready origin when it becomes available, or fails
 * with the origin's permanent error. Times out with UnhandledError after
 * {@link LOADING_TIMEOUT}.
 *
 * @remarks
 * Designed as a reusable primitive: any pipeline stage that encounters a
 * Loading origin can defer work through this utility rather than failing
 * eagerly.
 */
export const awaitOriginReady = (
  stateChanges: Stream.Stream<Either.Either<HubState, HubError>>,
  originUrl: string
): Effect.Effect<Origin.Ready<never>, ResourceRequest.CommonErrors> =>
  pipe(
    stateChanges,
    Stream.filterMap(Either.getRight),
    Stream.filterMap(HashMap.get(originUrl)),
    Stream.filter(Origin.isNotLoading),
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
    Effect.filterOrFail(Origin.isReady, (origin) => origin.errorStatus)
  )

// --- State access ---

/**
 * Waits for the Hub ref to hold a non-Loading state. If the current state
 * is Loading, subscribes to the changes stream until a settled state
 * arrives. Non-Loading errors fail immediately. Times out with
 * UnhandledError after {@link LOADING_TIMEOUT}.
 */
export const awaitReady = (
  stateRef: HubRef
): Effect.Effect<HubState, ResourceRequest.CommonErrors> =>
  Effect.flatMap(SubscriptionRef.get(stateRef), (current) => {
    if (Either.isRight(current)) return Effect.succeed(current.right)
    const error = current.left
    if (error._tag !== 'Loading') return Effect.fail(error)
    return stateRef.changes.pipe(
      StreamEither.filterErrors(isNotTagged('Loading')),
      Stream.runHead,
      Effect.timeoutFail({
        duration: LOADING_TIMEOUT,
        onTimeout: () =>
          new UnhandledError({
            message: 'Hub timed out while loading',
          }),
      }),
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

/**
 * Resolves which origin owns a resource URL by finding the single origin
 * whose URL is a parent of `url`. Fails with `NotFoundError` if no origin
 * matches, or `UnhandledError` if multiple origins match. Also propagates
 * any `CommonErrors` from awaiting Hub readiness.
 */
export const resolveOriginFromUrl = <Klass extends Resource.AnyDomainClass>(
  stateRef: HubRef,
  url: ReadonlyUrl,
  klass: Klass
): Effect.Effect<
  ReadonlyUrl,
  | NotFoundError<Klass['DomainType'], { url: ReadonlyUrl }>
  | ResourceRequest.CommonErrors
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
      () =>
        new NotFoundError({
          resourceType: klass.DomainType,
          params: { url },
        })
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

/**
 * Resolves the origin URL for a create request. Returns the explicit origin
 * if provided; otherwise finds the single origin that supports the given
 * domain class. Fails with `UnhandledError` if zero or multiple origins
 * match, or with `CommonErrors` from awaiting Hub readiness.
 */
export const resolveOriginForCreate = (
  stateRef: HubRef,
  klass: Resource.AnyDomainClass,
  explicitOrigin: ReadonlyUrl | undefined
): Effect.Effect<ReadonlyUrl, ResourceRequest.CommonErrors> =>
  explicitOrigin
    ? Effect.succeed(explicitOrigin)
    : pipe(
        awaitReady(stateRef),
        Effect.map((states) =>
          pipe(
            HashMap.values(states),
            Iterable.filter((o) =>
              Boolean(o.supportedResources[klass.DomainType])
            ),
            Iterable.map((o) => o.originUrl),
            Array.fromIterable
          )
        ),
        Effect.filterOrFail(
          Predicate.isTupleOfAtLeast(1),
          () =>
            new UnhandledError({
              message: `No origins found for resource type ${klass.DomainType}`,
            })
        ),
        Effect.filterOrFail(
          Predicate.isTupleOf(1),
          (matches) =>
            new UnhandledError({
              message: `Ambiguous origin for resource type ${klass.DomainType}: ${matches.length} origins match`,
            })
        ),
        Effect.map(([match]) => match)
      )
