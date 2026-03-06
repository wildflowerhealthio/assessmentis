import {
  Cause,
  Chunk,
  Effect,
  Either,
  Exit,
  Fiber,
  pipe,
  type Scope,
  type Stream,
} from 'effect'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useStream } from './useStream'

export function useEitherStream<A, E>(
  stream: Stream.Stream<Either.Either<A, E>, never, Scope.Scope>
): Promise<A> {
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
export function useEffectTs<A, E>(
  effect: Effect.Effect<A, E, never>
): Promise<A>
export function useEffectTs<A, E>(
  effect: Effect.Effect<A, E, Scope.Scope>
): Promise<A>
export function useEffectTs<A, E>(
  effect: Effect.Effect<A, E, Scope.Scope> | Effect.Effect<A, E, never>
): Promise<A> {
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
