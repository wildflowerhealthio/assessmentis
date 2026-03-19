import { Chunk, Effect, Option, Stream, Take } from 'effect'
import type { Either, PubSub, Scope } from 'effect'

/**
 * Subscribes to a `PubSub<Take<Either<A, E>>>` and returns a perpetual stream.
 * Dies if the underlying stream closes or emits an empty take — this is
 * intended for long-lived subscriptions that should never terminate.
 */
export const pubsubAsPerpetualStream = <A, E>(
  pubSub: PubSub.PubSub<Take.Take<Either.Either<A, E>>>
): Stream.Stream<Either.Either<A, E>, never, Scope.Scope> =>
  pubSub.subscribe.pipe(
    Effect.map((q) => Stream.fromQueue(q)),
    Stream.unwrap,
    Stream.mapEffect((take) =>
      Take.done(take).pipe(
        Effect.catchAll(
          Option.match({
            onNone: () => {
              return Effect.dieMessage(`Stream closed early`)
            },
            onSome: (a) => Effect.dieMessage(`Stream had unexpected error ${String(a)}`),
          })
        ),
        Effect.map(Chunk.last),
        Effect.flatMap((o) =>
          Option.match(o, {
            onNone: () => Effect.dieMessage('Stream completed without data'),
            onSome: (a) => Effect.succeed(a),
          })
        )
      )
    )
  )

/**
 * Takes exactly one value from a PubSub, scoped. Dies if the PubSub
 * closes before emitting. Useful for one-shot request/response patterns
 * over a shared PubSub channel.
 */
export const takeOneFromPubSubOrDie = <A, E>(
  pubSub: PubSub.PubSub<Take.Take<Either.Either<A, E>>>
): Effect.Effect<A, E> =>
  pubsubAsPerpetualStream(pubSub).pipe(
    Stream.take(1),
    Stream.runHead,
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.dieMessage(`Unexpected empty stream from pubSub`),
        onSome: (a) => a,
      })
    ),
    Effect.scoped
  )
