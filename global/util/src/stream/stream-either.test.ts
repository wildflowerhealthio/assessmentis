import { it } from '@effect/vitest'
import { Chunk, Effect, Either, Stream, FastCheck as fc } from 'effect'
import type { Brand } from 'effect'
import { assert, describe, expect, vi } from 'vitest'

import { isNotTagged } from '../predicates'
import { StreamEither } from './stream-either'

const rightStream = <A>(a: A) => Stream.succeed(Either.right(a))
const leftStream = <E>(e: E) => Stream.succeed(Either.left(e))

const collect = <A>(stream: Stream.Stream<A>) =>
  Stream.runCollect(stream).pipe(Effect.map(Chunk.toReadonlyArray))

const applyAndCollect = <A, B>(
  inputStream: Stream.Stream<A>,
  transformation: (s: Stream.Stream<A>) => Stream.Stream<B>
): Effect.Effect<readonly [A, B][]> =>
  Effect.gen(function* applyAndCollect() {
    const inputs = yield* collect(inputStream)
    const outputs = yield* collect(transformation(inputStream))

    if (inputs.length !== outputs.length) {
      throw new Error(`Input and output streams have different lengths`)
    }

    return inputs.map((a, i) => [a, outputs[i]] as [A, B])
  })

type A = Brand.Brand<'A'>
type E = Brand.Brand<'E'>

const arbitraryA: fc.Arbitrary<A> = fc.anything().map((a) => vi.mockObject(a) as A)
const arbitraryE: fc.Arbitrary<E> = fc.anything().map((e) => vi.mockObject(e) as E)

const eitherArb: fc.Arbitrary<Either.Either<A, E>> = fc.oneof(
  arbitraryA.map((x) => Either.right(x)),
  arbitraryE.map((e) => Either.left(e))
)

// oxlint-disable-next-line unicorn/no-array-callback-reference -- FastCheck .map, not Array.map
const streamEitherArb = fc.array(eitherArb).map(Stream.fromIterable)

const f = vi.fn<<In>(a: In) => { mappedFrom: In }>((mappedFrom) => ({
  mappedFrom,
}))

describe('StreamEither', () => {
  // Map(f) ≡ Stream.map(Either.map(f))
  it.effect.prop(
    'for every member of an input stream, StreamEither.map(f)' +
      ' applies f to Right values and preserves Left values',
    { stream: streamEitherArb },
    ({ stream }) =>
      Effect.gen(function* () {
        const cases = yield* applyAndCollect(
          stream,
          StreamEither.map((u) => f(u))
        )

        for (const [input, out] of cases) {
          if (Either.isRight(input) && Either.isRight(out)) {
            expect(f).toHaveBeenCalledWith(input.right)
            expect(out.right.mappedFrom).toBe(input.right)
          } else if (Either.isLeft(input) && Either.isLeft(out)) {
            expect(input.left).toEqual(out.left)
          } else {
            assert.fail('Input and output should both be Left or both be Right')
          }
        }
      })
  )

  it.effect.prop(
    'for every member of an input stream, StreamEither.mapLeft(f)' +
      ' applies f to Left values and preserves Right values',
    { stream: streamEitherArb },
    ({ stream }) =>
      Effect.gen(function* () {
        const cases = yield* applyAndCollect(stream, StreamEither.mapLeft(f))

        for (const [input, out] of cases) {
          if (Either.isRight(input) && Either.isRight(out)) {
            expect(input.right).toEqual(out.right)
          } else if (Either.isLeft(input) && Either.isLeft(out)) {
            expect(f).toHaveBeenCalledWith(input.left)
            expect(out.left.mappedFrom).toBe(input.left)
          } else {
            assert.fail('Input and output should both be Left or both be Right')
          }
        }
      })
  )

  describe('mapEffect', () => {
    describe('with an effectful function that succeeds', () => {
      it.effect.prop(
        'applies f to Right values, and returns the mapped result in Right and preserves Left values',
        { stream: streamEitherArb },
        ({ stream }) =>
          Effect.gen(function* () {
            const f = vi.fn((a: A) => Effect.succeed({ mappedFrom: a }))

            const cases = yield* applyAndCollect(stream, StreamEither.mapEffect(f))

            for (const [input, out] of cases) {
              if (Either.isRight(input) && Either.isRight(out)) {
                expect(f).toHaveBeenCalledWith(input.right)
                expect(out.right.mappedFrom).toBe(input.right)
              } else if (Either.isLeft(input) && Either.isLeft(out)) {
                expect(input.left).toEqual(out.left)
              } else {
                assert.fail('Input and output should both be Left or both be Right')
              }
            }
          })
      )
    })

    describe('with an effectful function that fails', () => {
      it.effect.prop(
        'applies f to Right values, and returns the mapped result in Left and preserves Left values',
        { stream: streamEitherArb },
        ({ stream }) =>
          Effect.gen(function* () {
            const f = vi.fn((a: A) => Effect.fail({ mappedFrom: a }))

            const cases = yield* applyAndCollect(stream, StreamEither.mapEffect(f))

            for (const [input, out] of cases) {
              if (Either.isRight(input) && Either.isLeft(out)) {
                expect(f).toHaveBeenCalledWith(input.right)
                expect(out.left).toHaveProperty('mappedFrom')
                expect((out.left as any).mappedFrom).toBe(input.right)
              } else if (Either.isLeft(input) && Either.isLeft(out)) {
                expect(input.left).toEqual(out.left)
              } else {
                assert.fail('Every input should produce a Left output when f fails')
              }
            }
          })
      )
    })
  })

  describe('flatMap', () => {
    describe('when f returns a Right stream', () => {
      it.effect.prop(
        'applies f to Right values and preserves Left values',
        { stream: streamEitherArb },
        ({ stream }) =>
          Effect.gen(function* () {
            const f = vi.fn((a: A) => rightStream({ mappedFrom: a }))

            const cases = yield* applyAndCollect(
              stream, // oxlint-disable-next-line unicorn/no-array-callback-reference -- Effect-TS pipe, not Array method
              StreamEither.flatMap(f)
            )

            for (const [input, out] of cases) {
              if (Either.isRight(input) && Either.isRight(out)) {
                expect(f).toHaveBeenCalledWith(input.right)
                expect(out.right.mappedFrom).toBe(input.right)
              } else if (Either.isLeft(input) && Either.isLeft(out)) {
                expect(input.left).toEqual(out.left)
              } else {
                assert.fail('Input and output should both be Left or both be Right')
              }
            }
          })
      )
    })

    describe('when f returns a Left stream', () => {
      it.effect.prop(
        'applies f to Right values, captures result as Left, and preserves Left values',
        { stream: streamEitherArb },
        ({ stream }) =>
          Effect.gen(function* () {
            const f = vi.fn((a: A) => leftStream({ mappedFrom: a }))

            const cases = yield* applyAndCollect(
              stream, // oxlint-disable-next-line unicorn/no-array-callback-reference -- Effect-TS pipe, not Array method
              StreamEither.flatMap(f)
            )

            for (const [input, out] of cases) {
              if (Either.isRight(input) && Either.isLeft(out)) {
                expect(f).toHaveBeenCalledWith(input.right)
                expect((out.left as any).mappedFrom).toBe(input.right)
              } else if (Either.isLeft(input) && Either.isLeft(out)) {
                expect(input.left).toEqual(out.left)
              } else {
                assert.fail('Every input should produce a Left output when f returns a Left stream')
              }
            }
          })
      )
    })
  })

  describe('tapRight', () => {
    it.effect.prop(
      'calls f on Right values and preserves all values unchanged',
      { stream: streamEitherArb },
      ({ stream }) =>
        Effect.gen(function* () {
          const f = vi.fn((a: A) => Effect.succeed({ tappedFrom: a }))

          const cases = yield* applyAndCollect(stream, StreamEither.tapRight(f))

          for (const [input, out] of cases) {
            if (Either.isRight(input) && Either.isRight(out)) {
              expect(f).toHaveBeenCalledWith(input.right)
              expect(input.right).toEqual(out.right)
            } else if (Either.isLeft(input) && Either.isLeft(out)) {
              expect(input.left).toEqual(out.left)
            } else {
              assert.fail('Input and output should both be Left or both be Right')
            }
          }
        })
    )
  })

  describe('tapLeft', () => {
    it.effect.prop(
      'calls f on Left values and preserves all values unchanged',
      { stream: streamEitherArb },
      ({ stream }) =>
        Effect.gen(function* () {
          const f = vi.fn((e: E) => Effect.succeed({ tappedFrom: e }))

          const cases = yield* applyAndCollect(stream, StreamEither.tapLeft(f))

          for (const [input, out] of cases) {
            if (Either.isRight(input) && Either.isRight(out)) {
              expect(input.right).toEqual(out.right)
            } else if (Either.isLeft(input) && Either.isLeft(out)) {
              expect(f).toHaveBeenCalledWith(input.left)
              expect(input.left).toEqual(out.left)
            } else {
              assert.fail('Input and output should both be Left or both be Right')
            }
          }
        })
    )
  })

  describe('zipLatest', () => {
    describe('when both streams emit Right', () => {
      it.effect.prop(
        'produces a Right tuple of both values',
        { a: arbitraryA, b: arbitraryA },
        ({ a, b }) =>
          Effect.gen(function* () {
            const result = yield* collect(StreamEither.zipLatest(rightStream(a), rightStream(b)))
            expect(result).toEqual([Either.right([a, b])])
          })
      )
    })

    describe('when left stream emits Left', () => {
      it.effect.prop('last emission is Left', { b: arbitraryA, e: arbitraryE }, ({ e, b }) =>
        Effect.gen(function* () {
          const result = yield* collect(StreamEither.zipLatest(leftStream(e), rightStream(b)))
          expect(Either.isLeft(result.at(-1)!)).toBe(true)
        })
      )
    })

    describe('when right stream emits Left', () => {
      it.effect.prop('last emission is Left', { a: arbitraryA, e: arbitraryE }, ({ a, e }) =>
        Effect.gen(function* () {
          const result = yield* collect(StreamEither.zipLatest(rightStream(a), leftStream(e)))
          expect(Either.isLeft(result.at(-1)!)).toBe(true)
        })
      )
    })
  })

  describe('zipLatestWith', () => {
    describe('when both streams emit Right', () => {
      it.effect.prop(
        'applies f to combined Right values',
        { a: arbitraryA, b: arbitraryA },
        ({ a, b }) =>
          Effect.gen(function* () {
            const f = vi.fn((_a: A, _b: A) => ({
              combinedFrom: [_a, _b] as const,
            }))
            const result = yield* collect(
              StreamEither.zipLatestWith(rightStream(a), rightStream(b), f)
            )
            expect(f).toHaveBeenCalledWith(a, b)
            expect(result).toEqual([Either.right({ combinedFrom: [a, b] })])
          })
      )
    })

    describe('when either stream emits Left', () => {
      it.effect.prop(
        'last emission is Left and f is not called',
        { b: arbitraryA, e: arbitraryE },
        ({ e, b }) =>
          Effect.gen(function* () {
            const f = vi.fn((_a: unknown, _b: A) => ({ combined: true }))
            const result = yield* collect(
              StreamEither.zipLatestWith(leftStream(e), rightStream(b), f)
            )
            expect(Either.isLeft(result.at(-1)!)).toBe(true)
            expect(f).not.toHaveBeenCalled()
          })
      )
    })
  })

  describe('filterErrors', () => {
    class FooError {
      readonly _tag = 'FooError' as const
      constructor(readonly message: string) {}
    }
    class BarError {
      readonly _tag = 'BarError' as const
      constructor(readonly message: string) {}
    }

    it.effect('keeps Right values unchanged', () =>
      Effect.gen(function* () {
        const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
          Either.right('a'),
          Either.right('b'),
          Either.left(new FooError('drop me'))
        )

        const result = yield* collect(
          stream.pipe(StreamEither.filterErrors((e) => e._tag !== 'FooError'))
        )

        expect(result).toEqual([Either.right('a'), Either.right('b')])
      })
    )

    it.effect('keeps Left values matching the predicate and drops non-matching', () =>
      Effect.gen(function* () {
        const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
          Either.right('ok'),
          Either.left(new FooError('drop')),
          Either.left(new BarError('keep'))
        )

        const result = yield* collect(
          stream.pipe(StreamEither.filterErrors((e) => e._tag !== 'FooError'))
        )

        expect(result).toEqual([Either.right('ok'), Either.left(new BarError('keep'))])
      })
    )

    it.effect('drops all Left values when predicate always returns false', () =>
      Effect.gen(function* () {
        const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
          Either.right('ok'),
          Either.left(new FooError('gone')),
          Either.left(new BarError('also gone'))
        )

        const result = yield* collect(stream.pipe(StreamEither.filterErrors(() => false)))

        expect(result).toEqual([Either.right('ok')])
      })
    )

    it.effect('keeps all Left values when predicate always returns true', () =>
      Effect.gen(function* () {
        const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
          Either.right('ok'),
          Either.left(new FooError('kept')),
          Either.left(new BarError('also kept'))
        )

        const result = yield* collect(stream.pipe(StreamEither.filterErrors(() => true)))

        expect(result).toEqual([
          Either.right('ok'),
          Either.left(new FooError('kept')),
          Either.left(new BarError('also kept')),
        ])
      })
    )

    it.effect.prop(
      'Right values always pass through unchanged, and Left values in output' +
        ' are exactly those satisfying the predicate',
      { keep: fc.boolean(), stream: streamEitherArb },
      ({ stream, keep }) =>
        Effect.gen(function* () {
          const predicate = vi.fn((_e: E) => keep)

          const inputs = yield* collect(stream)
          const outputs = yield* collect(stream.pipe(StreamEither.filterErrors(predicate)))

          let outputIdx = 0
          for (const input of inputs) {
            if (Either.isRight(input)) {
              // Right values always pass through unchanged
              const out = outputs[outputIdx]
              if (out === undefined || !Either.isRight(out)) {
                assert.fail('Expected Right in output for each Right in input')
              }
              expect(out.right).toEqual(input.right)
              outputIdx++
            } else if (predicate(input.left)) {
              // Left values matching the predicate appear in the output
              const out = outputs[outputIdx]
              if (out === undefined || !Either.isLeft(out)) {
                assert.fail('Expected Left in output for matching Left in input')
              }
              expect(out.left).toEqual(input.left)
              outputIdx++
            }
            // Left values not matching the predicate are dropped
          }

          // All output elements are accounted for
          expect(outputIdx).toBe(outputs.length)
        })
    )

    describe('refinement overload', () => {
      it.effect('narrows the error type when using a type guard like isNotTagged', () =>
        Effect.gen(function* () {
          const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
            Either.right('ok'),
            Either.left(new FooError('drop')),
            Either.left(new BarError('keep'))
          )

          const filtered = stream.pipe(StreamEither.filterErrors(isNotTagged('FooError')))

          // Type-level assertion: the filtered stream should have narrowed
          // The error type to exclude FooError. This assignment would fail
          // At compile time if type narrowing were broken.
          const _typeCheck: Stream.Stream<Either.Either<string, BarError>> = filtered

          const result = yield* collect(_typeCheck)

          expect(result).toEqual([Either.right('ok'), Either.left(new BarError('keep'))])
        })
      )
    })
  })

  describe('catchTag', () => {
    class FooError {
      readonly _tag = 'FooError' as const
      constructor(readonly message: string) {}
    }
    class BarError {
      readonly _tag = 'BarError' as const
      constructor(readonly message: string) {}
    }

    it.effect('recovers matching Left values to Right', () =>
      Effect.gen(function* () {
        const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
          Either.right('ok'),
          Either.left(new FooError('bad')),
          Either.left(new BarError('also bad'))
        )

        const result = yield* collect(
          stream.pipe(
            StreamEither.catchTag('FooError', (e) => Either.right(`recovered: ${e.message}`))
          )
        )

        expect(result).toEqual([
          Either.right('ok'),
          Either.right('recovered: bad'),
          Either.left(new BarError('also bad')),
        ])
      })
    )

    it.effect('can transform matching Left into a different Left', () =>
      Effect.gen(function* () {
        const stream: Stream.Stream<Either.Either<string, FooError | BarError>> = Stream.make(
          Either.left(new FooError('convert me')),
          Either.left(new BarError('keep me'))
        )

        const result = yield* collect(
          stream.pipe(
            StreamEither.catchTag('FooError', (e) =>
              Either.left(new BarError(`was foo: ${e.message}`))
            )
          )
        )

        expect(result).toEqual([
          Either.left(new BarError('was foo: convert me')),
          Either.left(new BarError('keep me')),
        ])
      })
    )
  })

  describe('head', () => {
    it.effect('returns the Right value from a stream whose first element is Right', () =>
      Effect.gen(function* () {
        const stream = Stream.make(Either.right('first'), Either.right('second'))
        const result = yield* StreamEither.head(stream)
        expect(result).toBe('first')
      })
    )

    it.effect('fails with the Left error from a stream whose first element is Left', () =>
      Effect.gen(function* () {
        const error = { _tag: 'TestError' as const, message: 'boom' }
        const stream: Stream.Stream<Either.Either<string, typeof error>> = Stream.make(
          Either.left(error),
          Either.right('second')
        )
        const result = yield* StreamEither.head(stream).pipe(Effect.either)
        expect(result).toEqual(Either.left(error))
      })
    )

    it.effect('fails with NoSuchElementException for an empty stream', () =>
      Effect.gen(function* () {
        const stream = Stream.empty as Stream.Stream<Either.Either<string>>
        const result = yield* StreamEither.head(stream).pipe(Effect.either)
        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left._tag).toBe('NoSuchElementException')
        }
      })
    )
  })

  describe('unwrap', () => {
    describe('with Right values', () => {
      it.effect.prop('Right values become stream values', { a: arbitraryA }, ({ a }) =>
        Effect.gen(function* () {
          const result = yield* collect(StreamEither.unwrap(rightStream(a)))
          expect(result).toEqual([a])
        })
      )
    })

    describe('with Left values', () => {
      it.effect.prop('Left values become stream errors', { e: arbitraryE }, ({ e }) =>
        Effect.gen(function* () {
          const result = yield* Stream.runCollect(StreamEither.unwrap(leftStream(e))).pipe(
            Effect.either
          )
          expect(result).toEqual(Either.left(e))
        })
      )
    })
  })
})
