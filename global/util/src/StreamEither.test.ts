import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Effect, Either, Stream, Chunk } from 'effect'
import * as StreamEither from './StreamEither'

const runStream = <A>(stream: Stream.Stream<A>) =>
  Stream.runCollect(stream).pipe(Effect.map(Chunk.toReadonlyArray), Effect.runPromise)

const eitherArb = fc.oneof(
  fc.integer().map((n): Either.Either<number, string> => Either.right(n)),
  fc.string().map((s): Either.Either<number, string> => Either.left(s)),
)

describe('StreamEither', () => {
  describe('map', () => {
    it('property: map(id) is identity', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(eitherArb), async (values) => {
          const stream = Stream.fromIterable(values)
          const result = await runStream(stream.pipe(StreamEither.map((x) => x)))
          expect(result).toEqual(values)
        })
      )
    })

    it('property: maps Right values, preserves Left values', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(eitherArb), async (values) => {
          const f = (n: number) => n * 2
          const stream = Stream.fromIterable(values)
          const result = await runStream(stream.pipe(StreamEither.map(f)))

          expect(result.length).toBe(values.length)
          result.forEach((r, i) => {
            const original = values[i]!
            if (Either.isRight(original)) {
              expect(r).toEqual(Either.right(f(original.right)))
            } else {
              expect(r).toEqual(original)
            }
          })
        })
      )
    })
  })

  describe('mapLeft', () => {
    it('property: maps Left values, preserves Right values', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(eitherArb), async (values) => {
          const f = (s: string) => s.toUpperCase()
          const stream = Stream.fromIterable(values)
          const result = await runStream(stream.pipe(StreamEither.mapLeft(f)))

          expect(result.length).toBe(values.length)
          result.forEach((r, i) => {
            const original = values[i]!
            if (Either.isLeft(original)) {
              expect(r).toEqual(Either.left(f(original.left)))
            } else {
              expect(r).toEqual(original)
            }
          })
        })
      )
    })
  })

  describe('mapEffect', () => {
    it('property: successful effects produce Right, preserves Left', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(eitherArb), async (values) => {
          const f = (n: number) => Effect.succeed(n * 3)
          const stream = Stream.fromIterable(values)
          const result = await runStream(stream.pipe(StreamEither.mapEffect(f)))

          expect(result.length).toBe(values.length)
          result.forEach((r, i) => {
            const original = values[i]!
            if (Either.isRight(original)) {
              expect(r).toEqual(Either.right(original.right * 3))
            } else {
              expect(r).toEqual(original)
            }
          })
        })
      )
    })

    it('property: failing effects produce Left', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (val) => {
          const stream: Stream.Stream<Either.Either<number, string>> =
            Stream.succeed(Either.right(val))
          const result = await runStream(
            stream.pipe(StreamEither.mapEffect(() => Effect.fail('effect-error')))
          )

          expect(result).toEqual([Either.left('effect-error')])
        })
      )
    })

    it('preserves existing Left when effect would have failed', async () => {
      const stream: Stream.Stream<Either.Either<number, string>> =
        Stream.succeed(Either.left('original-error'))
      const result = await runStream(
        stream.pipe(StreamEither.mapEffect(() => Effect.fail('should-not-reach')))
      )

      expect(result).toEqual([Either.left('original-error')])
    })
  })

  describe('flatMap', () => {
    it('property: Right values are flatMapped into inner stream', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (val) => {
          const stream: Stream.Stream<Either.Either<number, string>> =
            Stream.succeed(Either.right(val))
          const result = await runStream(
            stream.pipe(
              StreamEither.flatMap((n) =>
                Stream.fromIterable([
                  Either.right(n * 10) as Either.Either<number, string>,
                  Either.right(n * 20) as Either.Either<number, string>,
                ])
              )
            )
          )

          expect(result).toEqual([Either.right(val * 10), Either.right(val * 20)])
        })
      )
    })

    it('property: Left values are propagated without calling f', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (err) => {
          let called = false
          const stream: Stream.Stream<Either.Either<number, string>> =
            Stream.succeed(Either.left(err))
          const result = await runStream(
            stream.pipe(
              StreamEither.flatMap((n) => {
                called = true
                return Stream.succeed(Either.right(n) as Either.Either<number, string>)
              })
            )
          )

          expect(called).toBe(false)
          expect(result).toEqual([Either.left(err)])
        })
      )
    })

    it('inner stream Left values are propagated', async () => {
      const stream: Stream.Stream<Either.Either<number, string>> =
        Stream.succeed(Either.right(42))
      const result = await runStream(
        stream.pipe(
          StreamEither.flatMap(() =>
            Stream.succeed(Either.left('inner-error') as Either.Either<number, string>)
          )
        )
      )

      expect(result).toEqual([Either.left('inner-error')])
    })
  })

  describe('tapRight', () => {
    it('property: executes side effect on Right, preserves values', async () => {
      const collected: number[] = []
      await fc.assert(
        fc.asyncProperty(
          fc.array(eitherArb, { minLength: 1, maxLength: 10 }),
          async (values) => {
            collected.length = 0
            const stream = Stream.fromIterable(values)
            const result = await runStream(
              stream.pipe(
                StreamEither.tapRight((n) => Effect.sync(() => { collected.push(n) }))
              )
            )

            // Values unchanged
            expect(result).toEqual(values)
            // Side effect ran for Rights only
            const expectedRights = values.filter(Either.isRight).map((e) => e.right)
            expect(collected).toEqual(expectedRights)
          }
        )
      )
    })
  })

  describe('tapLeft', () => {
    it('property: executes side effect on Left, preserves values', async () => {
      const collected: string[] = []
      await fc.assert(
        fc.asyncProperty(
          fc.array(eitherArb, { minLength: 1, maxLength: 10 }),
          async (values) => {
            collected.length = 0
            const stream = Stream.fromIterable(values)
            const result = await runStream(
              stream.pipe(
                StreamEither.tapLeft((s) => Effect.sync(() => { collected.push(s) }))
              )
            )

            // Values unchanged
            expect(result).toEqual(values)
            // Side effect ran for Lefts only
            const expectedLefts = values.filter(Either.isLeft).map((e) => e.left)
            expect(collected).toEqual(expectedLefts)
          }
        )
      )
    })
  })

  describe('zipLatest', () => {
    it('combines two Right values into a tuple', async () => {
      const left: Stream.Stream<Either.Either<number, string>> = Stream.succeed(Either.right(1))
      const right: Stream.Stream<Either.Either<string, number>> = Stream.succeed(Either.right('a'))

      const result = await runStream(StreamEither.zipLatest(left, right))

      expect(result).toEqual([Either.right([1, 'a'])])
    })

    it('Left from left stream propagates', async () => {
      const left: Stream.Stream<Either.Either<number, string>> = Stream.succeed(Either.left('err'))
      const right: Stream.Stream<Either.Either<string, number>> = Stream.succeed(Either.right('a'))

      const result = await runStream(StreamEither.zipLatest(left, right))

      expect(result.length).toBeGreaterThanOrEqual(1)
      const lastResult = result[result.length - 1]!
      expect(Either.isLeft(lastResult)).toBe(true)
    })

    it('Left from right stream propagates', async () => {
      const left: Stream.Stream<Either.Either<number, string>> = Stream.succeed(Either.right(1))
      const right: Stream.Stream<Either.Either<string, number>> = Stream.succeed(Either.left(42))

      const result = await runStream(StreamEither.zipLatest(left, right))

      expect(result.length).toBeGreaterThanOrEqual(1)
      const lastResult = result[result.length - 1]!
      expect(Either.isLeft(lastResult)).toBe(true)
    })
  })

  describe('zipLatestWith', () => {
    it('combines two Right values with a function', async () => {
      const left: Stream.Stream<Either.Either<number, string>> = Stream.succeed(Either.right(2))
      const right: Stream.Stream<Either.Either<number, string>> = Stream.succeed(Either.right(3))

      const result = await runStream(
        StreamEither.zipLatestWith(left, right, (a, b) => a + b)
      )

      expect(result).toEqual([Either.right(5)])
    })
  })

  describe('unwrap', () => {
    it('property: Right values pass through, Left values become stream errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer(), { minLength: 1, maxLength: 5 }),
          async (vals) => {
            const stream: Stream.Stream<Either.Either<number, string>> =
              Stream.fromIterable(vals.map((v): Either.Either<number, string> => Either.right(v)))
            const result = await Effect.runPromise(
              Stream.runCollect(StreamEither.unwrap(stream)).pipe(
                Effect.map(Chunk.toReadonlyArray)
              )
            )
            expect(result).toEqual(vals)
          }
        )
      )
    })

    it('Left values become stream errors', async () => {
      const stream: Stream.Stream<Either.Either<number, string>> = Stream.fromIterable([
        Either.right(1) as Either.Either<number, string>,
        Either.left('error') as Either.Either<number, string>,
      ])

      const result = await Effect.runPromise(
        Stream.runCollect(StreamEither.unwrap(stream)).pipe(Effect.either)
      )

      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left).toBe('error')
      }
    })
  })
})
