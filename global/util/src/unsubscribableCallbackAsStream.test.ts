import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Effect, Either, Stream, Chunk, Deferred, Ref } from 'effect'
import { unsubscribableCallbackAsStream } from './unsubscribableCallbackAsStream'

describe('unsubscribableCallbackAsStream', () => {
  describe('subscription callback invocation', () => {
    it('property: subscribe callback is invoked when stream is consumed', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (val) => {
          let subscribeWasCalled = false

          const stream = unsubscribableCallbackAsStream<number, never>(
            (emit) => {
              subscribeWasCalled = true
              emit(Effect.succeed(val))
              return () => {}
            }
          )

          // Consume just one element from the stream
          await Effect.runPromise(
            stream.pipe(Stream.take(1), Stream.runDrain)
          )

          expect(subscribeWasCalled).toBe(true)
        })
      )
    })
  })

  describe('emitted values appear in stream', () => {
    it('property: values emitted via callback appear in the stream', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (val) => {
          const stream = unsubscribableCallbackAsStream<number, never>(
            (emit) => {
              emit(Effect.succeed(val))
              return () => {}
            }
          )

          const result = await Effect.runPromise(
            stream.pipe(Stream.take(1), Stream.runCollect)
          )

          const values = Chunk.toReadonlyArray(result)
          expect(values.length).toBe(1)
          expect(values[0]).toBe(val)
        })
      )
    })
  })

  describe('multiple emitted values', () => {
    it('property: multiple emitted values appear in order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer(), { minLength: 1, maxLength: 5 }),
          async (vals) => {
            const stream = unsubscribableCallbackAsStream<number, never>(
              (emit) => {
                vals.forEach((v) => emit(Effect.succeed(v)))
                return () => {}
              }
            )

            const result = await Effect.runPromise(
              stream.pipe(Stream.take(vals.length), Stream.runCollect)
            )

            const values = Chunk.toReadonlyArray(result)
            expect(values).toEqual(vals)
          }
        )
      )
    })
  })

  describe('unsubscribe is called on stream finalization', () => {
    it('property: unsubscribe function is called when stream is finalized', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (val) => {
          const program = Effect.gen(function* () {
            const unsubscribeCalled = yield* Ref.make(false)

            const stream = unsubscribableCallbackAsStream<number, never>(
              (emit) => {
                emit(Effect.succeed(val))
                return () => {
                  Effect.runSync(Ref.set(unsubscribeCalled, true))
                }
              }
            )

            // Consume the stream (this should trigger unsubscribe on completion)
            yield* stream.pipe(Stream.take(1), Stream.runDrain)

            // Check that unsubscribe was called
            const wasCalled = yield* Ref.get(unsubscribeCalled)
            expect(wasCalled).toBe(true)
          })

          await Effect.runPromise(program)
        })
      )
    })
  })

  describe('errors from emitted effects propagate to stream', () => {
    it('property: errors are propagated to the stream consumer', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (errorMsg) => {
          const stream = unsubscribableCallbackAsStream<number, string>(
            (emit) => {
              emit(Effect.fail(errorMsg))
              return () => {}
            }
          )

          const result = await Effect.runPromise(
            Effect.either(stream.pipe(Stream.take(1), Stream.runCollect))
          )

          expect(Either.isLeft(result)).toBe(true)
          if (Either.isLeft(result)) {
            expect(result.left).toBe(errorMsg)
          }
        })
      )
    })
  })

  describe('mixed success and error emissions', () => {
    it('property: stream processes values until first error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer(),
          fc.string(),
          fc.integer(),
          async (val1, errorMsg, val2) => {
            const stream = unsubscribableCallbackAsStream<number, string>(
              (emit) => {
                emit(Effect.succeed(val1))
                emit(Effect.fail(errorMsg))
                emit(Effect.succeed(val2)) // This should not be reached
                return () => {}
              }
            )

            const result = await Effect.runPromise(
              Effect.either(stream.pipe(Stream.runCollect))
            )

            expect(Either.isLeft(result)).toBe(true)
            if (Either.isLeft(result)) {
              expect(result.left).toBe(errorMsg)
            }
          }
        )
      )
    })
  })

  describe('async emission', () => {
    it('property: async emissions are captured by the stream', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (val) => {
          const program = Effect.gen(function* () {
            const deferred = yield* Deferred.make<void>()

            const stream = unsubscribableCallbackAsStream<number, never>(
              (emit) => {
                // Emit asynchronously after a small delay
                setTimeout(() => {
                  emit(Effect.succeed(val))
                  Effect.runSync(Deferred.succeed(deferred, undefined))
                }, 10)
                return () => {}
              }
            )

            // Consume the stream
            const result = yield* stream.pipe(Stream.take(1), Stream.runCollect)

            const values = Chunk.toReadonlyArray(result)
            expect(values.length).toBe(1)
            expect(values[0]).toBe(val)
          })

          await Effect.runPromise(program)
        })
      )
    })
  })
})
