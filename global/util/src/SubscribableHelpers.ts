import {
  SubscriptionRef,
  Either,
  Subscribable,
  Readable,
  Effect,
  Stream,
} from 'effect'
import { pipeArguments } from 'effect/Pipeable'

export const subscriptionRefToSubscribable = <A, E>(
  ref: SubscriptionRef.SubscriptionRef<Either.Either<A, E>>
): Subscribable.Subscribable<A, E> => ({
  [Subscribable.TypeId]: Subscribable.TypeId,
  [Readable.TypeId]: Readable.TypeId,
  get: Effect.flatMap(ref.get, (either) =>
    either.pipe(
      Either.match({
        onRight: (a) => Effect.succeed(a),
        onLeft: (e) => Effect.fail(e),
      })
    )
  ),
  changes: ref.changes.pipe(
    Stream.flatMap((either) =>
      either.pipe(
        Either.match({
          onRight: (a) => Stream.succeed(a),
          onLeft: (e) => Stream.fail(e),
        })
      )
    )
  ),
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
