import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Effect, Either, PubSub, Take, Stream, Chunk, Fiber } from 'effect'
import { pubsubAsPerpetualStream, takeOneFromPubSubOrDie } from './pubsubUtils'

describe('pubsubUtils', () => {
  describe('pubsubAsPerpetualStream', () => {
    describe('emits published values', () => {
      it('property: stream emits values published to the pubsub', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const program = Effect.gen(function* () {
              const pubsub =
                yield* PubSub.unbounded<
                  Take.Take<Either.Either<number, string>>
                >()

              // Start consuming the stream
              const fiber = yield* pubsubAsPerpetualStream(pubsub).pipe(
                Stream.take(1),
                Stream.runCollect,
                Effect.scoped,
                Effect.fork
              )

              // Give the fiber time to subscribe
              yield* Effect.sleep('10 millis')

              // Publish a value
              yield* pubsub.publish(Take.of(Either.right(val)))

              // Get the result
              const result = yield* Fiber.join(fiber)
              const values = Chunk.toReadonlyArray(result)

              expect(values.length).toBe(1)
              expect(Either.isRight(values[0]!)).toBe(true)
              if (Either.isRight(values[0]!)) {
                expect(values[0].right).toBe(val)
              }
            })

            await Effect.runPromise(program)
          })
        )
      })
    })

    describe('emits multiple values', () => {
      it('property: stream emits all published values in order', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.integer(), { minLength: 1, maxLength: 5 }),
            async (vals) => {
              const program = Effect.gen(function* () {
                const pubsub =
                  yield* PubSub.unbounded<
                    Take.Take<Either.Either<number, string>>
                  >()

                // Start consuming the stream
                const fiber = yield* pubsubAsPerpetualStream(pubsub).pipe(
                  Stream.take(vals.length),
                  Stream.runCollect,
                  Effect.scoped,
                  Effect.fork
                )

                // Give the fiber time to subscribe
                yield* Effect.sleep('10 millis')

                // Publish all values
                for (const val of vals) {
                  yield* pubsub.publish(Take.of(Either.right(val)))
                }

                // Get the result
                const result = yield* Fiber.join(fiber)
                const values = Chunk.toReadonlyArray(result)

                expect(values.length).toBe(vals.length)
                values.forEach((v, i) => {
                  expect(Either.isRight(v)).toBe(true)
                  if (Either.isRight(v)) {
                    expect(v.right).toBe(vals[i])
                  }
                })
              })

              await Effect.runPromise(program)
            }
          )
        )
      })
    })

    describe('propagates Either.Left values', () => {
      it('property: stream emits Left values as Either.Left', async () => {
        await fc.assert(
          fc.asyncProperty(fc.string(), async (errorMsg) => {
            const program = Effect.gen(function* () {
              const pubsub =
                yield* PubSub.unbounded<
                  Take.Take<Either.Either<number, string>>
                >()

              // Start consuming the stream
              const fiber = yield* pubsubAsPerpetualStream(pubsub).pipe(
                Stream.take(1),
                Stream.runCollect,
                Effect.scoped,
                Effect.fork
              )

              // Give the fiber time to subscribe
              yield* Effect.sleep('10 millis')

              // Publish an error
              yield* pubsub.publish(Take.of(Either.left(errorMsg)))

              // Get the result
              const result = yield* Fiber.join(fiber)
              const values = Chunk.toReadonlyArray(result)

              expect(values.length).toBe(1)
              expect(Either.isLeft(values[0]!)).toBe(true)
              if (Either.isLeft(values[0]!)) {
                expect(values[0].left).toBe(errorMsg)
              }
            })

            await Effect.runPromise(program)
          })
        )
      })
    })
  })

  describe('takeOneFromPubSubOrDie', () => {
    describe('extracts single value', () => {
      it('property: extracts the Right value from pubsub', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const program = Effect.gen(function* () {
              const pubsub =
                yield* PubSub.unbounded<
                  Take.Take<Either.Either<number, string>>
                >()

              // Start waiting for value
              const fiber = yield* takeOneFromPubSubOrDie(pubsub).pipe(
                Effect.fork
              )

              // Give the fiber time to subscribe
              yield* Effect.sleep('10 millis')

              // Publish a value
              yield* pubsub.publish(Take.of(Either.right(val)))

              // Get the result
              const result = yield* Fiber.join(fiber)

              expect(result).toBe(val)
            })

            await Effect.runPromise(program)
          })
        )
      })
    })

    describe('propagates errors', () => {
      it('property: Left value causes the effect to fail', async () => {
        await fc.assert(
          fc.asyncProperty(fc.string(), async (errorMsg) => {
            const program = Effect.gen(function* () {
              const pubsub =
                yield* PubSub.unbounded<
                  Take.Take<Either.Either<number, string>>
                >()

              // Start waiting for value
              const fiber = yield* takeOneFromPubSubOrDie(pubsub).pipe(
                Effect.either,
                Effect.fork
              )

              // Give the fiber time to subscribe
              yield* Effect.sleep('10 millis')

              // Publish an error
              yield* pubsub.publish(Take.of(Either.left(errorMsg)))

              // Get the result
              const result = yield* Fiber.join(fiber)

              expect(Either.isLeft(result)).toBe(true)
              if (Either.isLeft(result)) {
                expect(result.left).toBe(errorMsg)
              }
            })

            await Effect.runPromise(program)
          })
        )
      })
    })

    describe('takes only first value', () => {
      it('property: ignores values after the first', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer(),
            fc.integer(),
            async (first, second) => {
              const program = Effect.gen(function* () {
                const pubsub =
                  yield* PubSub.unbounded<
                    Take.Take<Either.Either<number, string>>
                  >()

                // Start waiting for value
                const fiber = yield* takeOneFromPubSubOrDie(pubsub).pipe(
                  Effect.fork
                )

                // Give the fiber time to subscribe
                yield* Effect.sleep('10 millis')

                // Publish two values
                yield* pubsub.publish(Take.of(Either.right(first)))
                yield* pubsub.publish(Take.of(Either.right(second)))

                // Get the result - should be the first value
                const result = yield* Fiber.join(fiber)

                expect(result).toBe(first)
              })

              await Effect.runPromise(program)
            }
          )
        )
      })
    })
  })
})
