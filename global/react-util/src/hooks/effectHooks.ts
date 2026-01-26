import { Cause, Chunk, Effect, Exit, Fiber, pipe, Scope, Stream } from 'effect'
import { useState, useEffect, useRef, useMemo } from 'react'

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
          promiseWithResolversRef.current.resolve(a)
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
