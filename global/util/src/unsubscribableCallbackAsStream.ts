import type { StreamEmit } from 'effect'
import { Chunk, Effect, Option, Stream } from 'effect'

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
