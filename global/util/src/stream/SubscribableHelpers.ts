import {
  Effect,
  Readable,
  Stream,
  Subscribable,
  type Either,
  type SubscriptionRef,
} from 'effect'
import { pipeArguments } from 'effect/Pipeable'

import { StreamEither } from './StreamEither'

/**
 * Adapts a `SubscriptionRef<Either<A, E>>` into an Effect `Subscribable<A, E>`.
 * The `get` accessor unwraps the Either, and `changes` uses {@link StreamEither.unwrap}
 * to promote Left values into stream errors.
 */
export const subscriptionRefToSubscribable = <A, E>(
  ref: SubscriptionRef.SubscriptionRef<Either.Either<A, E>>
): Subscribable.Subscribable<A, E> => ({
  [Subscribable.TypeId]: Subscribable.TypeId,
  [Readable.TypeId]: Readable.TypeId,
  get: Effect.flatMap(ref.get, (either) => either),
  changes: StreamEither.unwrap(ref.changes),
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  },
})

/**
 * Wraps a single `Effect<A, E>` as a `Subscribable<A, E>`. The `get` accessor
 * re-runs the effect each time; `changes` emits exactly one value from the effect.
 */
export const effectToSubscribable = <A, E>(
  effect: Effect.Effect<A, E>
): Subscribable.Subscribable<A, E> => ({
  [Subscribable.TypeId]: Subscribable.TypeId,
  [Readable.TypeId]: Readable.TypeId,
  get: effect,
  changes: effect.pipe(Stream.fromEffect),
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  },
})
