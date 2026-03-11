import {
  Chunk,
  Effect,
  Option,
  Stream,
  Take,
  type Either,
  type PubSub,
  type Scope,
} from 'effect'

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
            onSome: (a) =>
              Effect.dieMessage(`Stream had unexpected error ${String(a)}`),
            onNone: () => {
              return Effect.dieMessage(`Stream closed early`)
            },
          })
        ),
        Effect.map(Chunk.last),
        Effect.flatMap((o) =>
          Option.match(o, {
            onSome: (a) => Effect.succeed(a),
            onNone: () => Effect.dieMessage('Stream completed without data'),
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
): Effect.Effect<A, E, never> =>
  pubsubAsPerpetualStream(pubSub).pipe(
    Stream.take(1),
    Stream.runHead,
    Effect.flatMap(
      Option.match({
        onSome: (a) => a,
        onNone: () => Effect.dieMessage(`Unexpected empty stream from pubSub`),
      })
    ),
    Effect.scoped
  )
