import type { Scope, Stream } from 'effect'
import { Cause, Chunk, Effect, Either, Exit, Fiber, pipe } from 'effect'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useStream } from './useStream'

/**
 * Subscribes to a `Stream<Either<A, E>>` and returns a `Promise<A>`.
 * Right values resolve the promise; Left values reject it.
 * Re-subscribes when the stream reference changes.
 */
export const useEitherStream = <A, E>(
  stream: Stream.Stream<Either.Either<A, E>, never, Scope.Scope>
): Promise<A> => {
  const eitherPromise = useStream(stream)

  return useMemo(
    () =>
      eitherPromise.then(
        Either.match({
          onRight(right) {
            return right
          },
          onLeft(left) {
            throw left
          },
        })
      ),
    [eitherPromise]
  )
}

/**
 * A controllable promise whose resolution can be driven imperatively.
 * Returns `[promise, { resolve, reject, reset, map }]`.
 *
 * - `resolve(a)` resolves the current promise (or creates a new resolved one if already settled)
 * - `reject(reason)` rejects similarly
 * - `reset()` replaces the settled promise with a fresh pending one
 * - `map(f)` applies `f` to the resolved value (or queues it to be applied when resolved)
 */
export const useStatePromise = <A>() => {
  const resolvedRef = useRef(false)
  const initial = Promise.withResolvers<A>()
  const promiseWithResolversRef = useRef(initial)
  const mappingRef = useRef((a: A): A => a)
  const [promise, setPromise] = useState(initial.promise)

  const callbacks = useMemo(
    () => ({
      map: (f: (a: A) => A) => {
        if (resolvedRef.current) {
          setPromise((p) => p.then((a) => f(a)))
        } else {
          mappingRef.current = (a) => f(mappingRef.current(a))
        }
      },
      resolve: (a: A) => {
        if (resolvedRef.current) {
          promiseWithResolversRef.current = Promise.withResolvers<A>()
          promiseWithResolversRef.current.resolve(a)
          setPromise(promiseWithResolversRef.current.promise)
        } else {
          resolvedRef.current = true
          const mapped = mappingRef.current(a)
          mappingRef.current = (x: A): A => x
          promiseWithResolversRef.current.resolve(mapped)
        }
      },
      reject: (reason: unknown) => {
        if (resolvedRef.current) {
          promiseWithResolversRef.current = Promise.withResolvers<A>()
          promiseWithResolversRef.current.reject(reason)
          setPromise(promiseWithResolversRef.current.promise)
          return promiseWithResolversRef.current.promise
        } else {
          resolvedRef.current = true
          promiseWithResolversRef.current.reject(reason)
          return promiseWithResolversRef.current.promise
        }
      },
      reset: () => {
        if (!resolvedRef.current) return

        resolvedRef.current = false
        promiseWithResolversRef.current = Promise.withResolvers<A>()
        setPromise(promiseWithResolversRef.current.promise)
      },
    }),
    []
  )

  return [promise, callbacks] as const
}
/**
 * Runs a scoped `Effect<A, E>` and returns a `Promise<A>` that tracks its
 * result. The fiber is interrupted on unmount or when `effect` changes.
 * Failures surface as promise rejections; pure interruptions are silently ignored.
 */
export const useEffectTs = <A, E>(
  effect: Effect.Effect<A, E, Scope.Scope>
): Promise<A> => {
  const [promise, { resolve, reject, reset }] = useStatePromise<A>()

  useEffect(() => {
    const fiber = Effect.runFork(effect.pipe(Effect.scoped))

    fiber.addObserver(
      Exit.match({
        onSuccess(a) {
          resolve(a)
        },
        onFailure(cause) {
          if (Cause.isInterruptedOnly(cause)) {
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

          console.error('Effect failed with cause:', cause)
        },
      })
    )

    return () => {
      Effect.runFork(
        pipe(Fiber.interrupt(fiber), Effect.andThen(Effect.sync(reset)))
      )
    }
  }, [effect, resolve, reject, reset])

  return promise
}
