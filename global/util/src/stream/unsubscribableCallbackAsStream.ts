import { Chunk, Effect, Option, Stream, type StreamEmit } from 'effect'

/**
 * Bridges a callback-based subscription API into an Effect `Stream`. The
 * `subscribe` function receives a callback and returns an unsubscribe
 * function. The stream automatically unsubscribes when its scope closes.
 *
 * @param subscribe - A function that accepts an element callback and returns an unsubscribe function
 */
export const unsubscribableCallbackAsStream = <A, E>(
  subscribe: (onElement: (e: Effect.Effect<A, E>) => void) => () => void
) =>
  Stream.acquireRelease(
    Effect.sync(function () {
      const state: {
        unsubscribe: () => void
        stream: Stream.Stream<A, E, never>
      } = { unsubscribe: () => {}, stream: Stream.never }

      state.stream = Stream.async(
        (emit: StreamEmit.Emit<never, E, A, void>) => {
          state.unsubscribe = subscribe((element) =>
            emit(
              element.pipe(Effect.map(Chunk.of), Effect.mapError(Option.some))
            )
          )
        }
      )
      return state
    }),
    ({ unsubscribe }) => {
      return Effect.sync(unsubscribe)
    }
  ).pipe(Stream.flatMap(({ stream }) => stream))
