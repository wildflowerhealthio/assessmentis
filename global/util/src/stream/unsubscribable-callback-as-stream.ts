import { Chunk, Effect, Option, Stream } from 'effect'
import type { StreamEmit } from 'effect'

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
): Stream.Stream<A, E> =>
  Stream.acquireRelease(
    Effect.sync(function unsubscribableCallbackAsStreamInit() {
      const state: {
        unsubscribe: () => void
        stream: Stream.Stream<A, E>
      } = { stream: Stream.never, unsubscribe: () => {} }

      state.stream = Stream.async((emit: StreamEmit.Emit<never, E, A, void>) => {
        state.unsubscribe = subscribe((element) =>
          emit(element.pipe(Effect.map(Chunk.of), Effect.mapError(Option.some)))
        )
      })
      return state
    }),
    ({ unsubscribe }) => Effect.sync(unsubscribe)
  ).pipe(Stream.flatMap(({ stream }) => stream))
