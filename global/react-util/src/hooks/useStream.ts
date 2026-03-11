import type { Scope } from 'effect'
import { Cause, Chunk, Effect, Exit, Fiber, Stream } from 'effect'
import { useEffect } from 'react'
import { useStatePromise } from './effectHooks'

/**
 * Subscribes to a scoped Effect `Stream<A, E>` and returns a `Promise<A>`
 * that resolves with the latest emitted value. The stream fiber is
 * interrupted on unmount or when the stream reference changes.
 */
export const useStream = <A, E>(
  stream: Stream.Stream<A, E, Scope.Scope>
): Promise<A> => {
  const [promise, { resolve, reject, reset }] = useStatePromise<A>()

  useEffect(() => {
    reset()

    const s = Stream.runForEach(stream, (e) =>
      Effect.sync(() => {
        resolve(e)
      })
    ).pipe(Effect.scoped)
    const fiber = Effect.runFork(s)

    fiber.addObserver(
      Exit.match({
        onSuccess(_) {
          // No action needed on successful completion
        },
        onFailure(cause) {
          if (Cause.isInterrupted(cause)) {
            return
          }

          const failures = Chunk.toArray(Cause.failures(cause))

          if (failures.length == 1) {
            reject(failures[0])
            return
          } else if (failures.length > 1) {
            reject(new AggregateError(failures, 'Multiple failures occurred'))
            return
          }

          const defects = Chunk.toArray(Cause.defects(cause))

          if (defects.length > 0) {
            reject(new AggregateError(defects, 'Multiple defects occurred'))
            return
          }
          console.error('Stream failed with cause:', cause)
        },
      })
    )

    return () => {
      Effect.runPromise(Fiber.interrupt(fiber))
    }
  }, [reject, reset, resolve, stream])

  return promise
}
