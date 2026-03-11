import { Chunk, Effect, Option, Stream, type StreamEmit } from 'effect'

/**
 * Bridges a callback-based subscription API into an Effect `Stream`.
 *
 * @param subscribe - Called once to start the subscription. Receives a
 *   callback that the caller invokes with each new element (as an
 *   `Effect<A, E>` so errors can be emitted). Must return an unsubscribe
 *   function that will be called when the stream's scope closes.
 * @returns A scoped `Stream<A, E>` that unsubscribes automatically on close.
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
