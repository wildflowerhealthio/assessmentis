import {
  SubscriptionRef,
  Either,
  Subscribable,
  Readable,
  Effect,
  Stream,
} from 'effect'
import { pipeArguments } from 'effect/Pipeable'
import { unwrap } from './StreamEither'

export const subscriptionRefToSubscribable = <A, E>(
  ref: SubscriptionRef.SubscriptionRef<Either.Either<A, E>>
): Subscribable.Subscribable<A, E> => ({
  [Subscribable.TypeId]: Subscribable.TypeId,
  [Readable.TypeId]: Readable.TypeId,
  get: Effect.flatMap(ref.get, (either) => either),
  changes: unwrap(ref.changes),
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  },
})

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
