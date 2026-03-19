import {
  Cause,
  Chunk,
  Effect,
  Either,
  Exit,
  Option,
  Readable,
  Stream,
  Subscribable,
  SubscriptionRef,
  pipe,
} from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { effectToSubscribable, subscriptionRefToSubscribable } from './subscribable-helpers'

describe('SubscribableHelpers', () => {
  describe('subscriptionRefToSubscribable', () => {
    describe('TypeId implementation', () => {
      it('property: has correct TypeId and required fields', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const program = Effect.gen(function* program() {
              const ref = yield* SubscriptionRef.make(Either.right(val))
              const subscribable = subscriptionRefToSubscribable(ref)

              // Verify TypeIds
              expect(subscribable[Subscribable.TypeId]).toBe(Subscribable.TypeId)
              expect(subscribable[Readable.TypeId]).toBe(Readable.TypeId)

              // Verify required fields exist and have correct types
              expect(subscribable.get).toBeDefined()
              expect(Effect.isEffect(subscribable.get)).toBe(true)
              expect(subscribable.changes).toBeDefined()
              expect(typeof subscribable.changes).toBe('object')
            })

            await Effect.runPromise(program)
          })
        )
      })
    })

    describe('get behavior with Either.Right', () => {
      it('property: get returns the Right value as success', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const program = Effect.gen(function* program() {
              const ref = yield* SubscriptionRef.make(Either.right(val))
              const subscribable = subscriptionRefToSubscribable(ref)

              const result = yield* subscribable.get

              expect(result).toBe(val)
            })

            await Effect.runPromise(program)
          })
        )
      })
    })

    describe('get behavior with Either.Left', () => {
      it('property: get fails with the Left value', async () => {
        await fc.assert(
          fc.asyncProperty(fc.string(), async (errorMsg) => {
            const program = Effect.gen(function* program() {
              const ref = yield* SubscriptionRef.make(
                Either.left(errorMsg) as Either.Either<number, string>
              )
              const subscribable = subscriptionRefToSubscribable(ref)

              // Expect the get to fail with the error message
              return yield* subscribable.get
            })

            const exit = await Effect.runPromiseExit(program)
            expect(Exit.isFailure(exit)).toBeTruthy()
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap((cause) => Cause.failureOption(cause)),
              Option.getOrThrow
            )
            expect(error).toBe(errorMsg)
          })
        )
      })
    })

    describe('changes stream with Right values', () => {
      it('property: changes stream emits Right values as successes', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), fc.integer(), async (initialVal, newVal) => {
            const program = Effect.gen(function* program() {
              const ref = yield* SubscriptionRef.make(Either.right(initialVal))
              const subscribable = subscriptionRefToSubscribable(ref)

              // Update the ref
              yield* SubscriptionRef.set(ref, Either.right(newVal))

              // Take first value from changes stream
              const result = yield* subscribable.changes.pipe(Stream.take(1), Stream.runCollect)

              const values = Chunk.toReadonlyArray(result)
              expect(values.length).toBe(1)
              expect(values[0]).toBe(newVal)
            })

            await Effect.runPromise(program)
          })
        )
      })
    })

    describe('pipe method', () => {
      it('property: pipe method is callable and returns transformed value', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const program = Effect.gen(function* program() {
              const ref = yield* SubscriptionRef.make(Either.right(val))
              const subscribable = subscriptionRefToSubscribable(ref)

              // Use pipe to transform
              const result = yield* subscribable.pipe(Subscribable.map((x: number) => x * 2)).get

              expect(result).toBe(val * 2)
            })

            await Effect.runPromise(program)
          })
        )
      })
    })
  })

  describe('effectToSubscribable', () => {
    describe('TypeId implementation', () => {
      it('property: returns object with correct Subscribable TypeId', () => {
        fc.assert(
          fc.property(fc.integer(), (val) => {
            const effect = Effect.succeed(val)
            const subscribable = effectToSubscribable(effect)

            expect(subscribable[Subscribable.TypeId]).toBe(Subscribable.TypeId)
            expect(subscribable[Readable.TypeId]).toBe(Readable.TypeId)
          })
        )
      })
    })

    describe('get behavior with successful effect', () => {
      it('property: get returns the effect value', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const effect = Effect.succeed(val)
            const subscribable = effectToSubscribable(effect)

            const result = await Effect.runPromise(subscribable.get)

            expect(result).toBe(val)
          })
        )
      })
    })

    describe('get behavior with failed effect', () => {
      it('property: get propagates the effect failure', async () => {
        await fc.assert(
          fc.asyncProperty(fc.string(), async (errorMsg) => {
            const effect = Effect.fail(errorMsg)
            const subscribable = effectToSubscribable(effect)

            const exit = await Effect.runPromiseExit(subscribable.get)

            expect(Exit.isFailure(exit)).toBeTruthy()
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap((cause) => Cause.failureOption(cause)),
              Option.getOrThrow
            )
            expect(error).toBe(errorMsg)
          })
        )
      })
    })

    describe('changes stream', () => {
      it('property: changes emits the effect value once', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const effect = Effect.succeed(val)
            const subscribable = effectToSubscribable(effect)

            const result = await Effect.runPromise(subscribable.changes.pipe(Stream.runCollect))

            const values = Chunk.toReadonlyArray(result)
            expect(values.length).toBe(1)
            expect(values[0]).toBe(val)
          })
        )
      })
    })

    describe('changes stream with failure', () => {
      it('property: changes stream fails with the effect error', async () => {
        await fc.assert(
          fc.asyncProperty(fc.string(), async (errorMsg) => {
            const effect = Effect.fail(errorMsg)
            const subscribable = effectToSubscribable(effect)

            const exit = await Effect.runPromiseExit(subscribable.changes.pipe(Stream.runCollect))

            expect(Exit.isFailure(exit)).toBeTruthy()
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap((cause) => Cause.failureOption(cause)),
              Option.getOrThrow
            )
            expect(error).toBe(errorMsg)
          })
        )
      })
    })

    describe('pipe method', () => {
      it('property: pipe method is callable and returns transformed value', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer(), async (val) => {
            const effect = Effect.succeed(val)
            const subscribable = effectToSubscribable(effect)

            const result = await Effect.runPromise(
              subscribable.pipe(Subscribable.map((x: number) => x * 2)).get
            )

            expect(result).toBe(val * 2)
          })
        )
      })
    })
  })
})
