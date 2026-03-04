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
