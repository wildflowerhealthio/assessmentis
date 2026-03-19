import { Cause, Chunk, Effect, Either, Exit, Fiber, pipe } from 'effect'
import type { Scope, Stream } from 'effect'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useStream } from './use-stream'

/**
 * Subscribes to a `Stream<Either<A, E>>` and returns a `Promise<A>`.
 * Right values resolve the promise; Left values reject it.
 *
 * @param stream - A scoped stream of `Either` values
 * @returns A promise that resolves with the latest `Right` or rejects with the first `Left`
 *
 * @remarks
 * Delegates to {@link useStream} for fiber lifecycle — re-subscribes
 * when the stream reference changes.
 */
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

/**
 * A controllable promise whose resolution can be driven imperatively.
 *
 * @typeParam A - The type the promise resolves to
 * @returns A tuple `[promise, callbacks]` where:
 *   - `promise` — the current `Promise<A>`, stable until `reset`
 *   - `callbacks.resolve(a)` — resolves the promise (applies any queued maps),
 *     or replaces an already-settled promise with a new resolved one
 *   - `callbacks.reject(reason)` — rejects similarly
 *   - `callbacks.reset()` — replaces a settled promise with a fresh pending one
 *   - `callbacks.map(f)` — transforms the resolved value, or queues `f` if pending
 *
 * @remarks
 * This is the low-level primitive behind {@link useEffectTs} and
 * {@link useStream}. It bridges imperative Effect fiber callbacks into
 * React's Suspense model by exposing a stable `Promise` whose settlement
 * can be driven from outside.
 *
 * The `map` callback composes transformations: if the promise is already
 * resolved, `map` chains `.then(f)` onto it; if still pending, `f` is
 * queued and applied atomically at resolve time. This enables
 * optimistic-update patterns (e.g. {@link useCollectionPromise}) without
 * re-creating the promise identity.
 */
/* oxlint-disable typescript-eslint/explicit-function-return-type -- internal callbacks within useMemo have types inferred by the outer function's return */
export const useStatePromise = <A>(): readonly [
  Promise<A>,
  {
    map: (f: (a: A) => A) => void
    resolve: (a: A) => void
    reject: (reason: unknown) => Promise<A>
    reset: () => void
  },
] => {
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
          const prev = mappingRef.current
          mappingRef.current = (a) => f(prev(a))
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
        }
        resolvedRef.current = true
        promiseWithResolversRef.current.reject(reason)
        return promiseWithResolversRef.current.promise
      },
      reset: () => {
        if (!resolvedRef.current) {
          return
        }

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
 * Runs a scoped `Effect<A, E>` and returns a `Promise<A>` that tracks its result.
 *
 * @typeParam A - The success type of the effect
 * @typeParam E - The error type of the effect
 * @param effect - A scoped effect to run; re-evaluated when the reference changes
 * @returns A `Promise<A>` suitable for React Suspense (`use()`)
 *
 * @remarks
 * The effect is forked into an unmanaged fiber on mount. The fiber's exit is
 * observed and mapped to promise settlement:
 *
 * - **Success** resolves the promise.
 * - **Pure interruption** (`Cause.isInterruptedOnly`) is silently ignored —
 *   this is the normal cleanup path when `effect` changes or the component unmounts.
 * - **Failure** (single) rejects with the error value directly.
 * - **Multiple failures/defects** reject with an `AggregateError`.
 *
 * On cleanup the fiber is interrupted and the promise is reset to pending,
 * ready for the next effect.
 */
export function useEffectTs<A, E>(effect: Effect.Effect<A, E, Scope.Scope>): Promise<A> {
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

          if (failures.length === 1) {
            void reject(failures[0])
            return
          } else if (failures.length > 1) {
            void reject(new AggregateError(failures, 'Multiple failures occurred'))
            return
          }

          const defects = Chunk.toArray(Cause.defects(cause))

          if (defects.length > 0) {
            void reject(new AggregateError(defects, 'Multiple defects occurred'))
            return
          }

          console.error('Effect failed with cause:', cause)
        },
      })
    )

    return (): void => {
      Effect.runFork(pipe(Fiber.interrupt(fiber), Effect.andThen(Effect.sync(reset))))
    }
  }, [effect, resolve, reject, reset])

  return promise
}
/* oxlint-enable typescript-eslint/explicit-function-return-type */
