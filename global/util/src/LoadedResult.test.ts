import { expect, test, describe } from 'vitest'
import { LoadedResult, LoadedResultStream } from './LoadedResult'
import { Effect, pipe, SubscriptionRef, Stream } from 'effect'

describe('LoadedResult', () => {
  test('loading creates a loading result', () => {
    const result = LoadedResult.loading<string, Error>()
    expect(result._tag).toBe('loading')
  })

  test('error creates an error result', () => {
    const error = new Error('test error')
    const result = LoadedResult.error<string, Error>(error)
    expect(result._tag).toBe('error')
    if (result._tag === 'error') {
      expect(result.error).toBe(error)
    }
  })

  test('loaded creates a loaded result', () => {
    const value = 'test value'
    const result = LoadedResult.loaded<string, Error>(value)
    expect(result._tag).toBe('loaded')
    if (result._tag === 'loaded') {
      expect(result.value).toBe(value)
    }
  })

  describe('map', () => {
    test('maps loaded value', () => {
      const result = LoadedResult.loaded<number, Error>(5)
      const mapped = pipe(
        result,
        LoadedResult.map((x) => x * 2)
      )
      expect(mapped._tag).toBe('loaded')
      if (mapped._tag === 'loaded') {
        expect(mapped.value).toBe(10)
      }
    })

    test('preserves loading state', () => {
      const result = LoadedResult.loading<number, Error>()
      const mapped = pipe(
        result,
        LoadedResult.map((x) => x * 2)
      )
      expect(mapped._tag).toBe('loading')
    })

    test('preserves error state', () => {
      const error = new Error('test error')
      const result = LoadedResult.error<number, Error>(error)
      const mapped = pipe(
        result,
        LoadedResult.map((x) => x * 2)
      )
      expect(mapped._tag).toBe('error')
      if (mapped._tag === 'error') {
        expect(mapped.error).toBe(error)
      }
    })
  })
})

describe('LoadedResultStream', () => {
  test('succeed creates a stream with loaded value', async () => {
    const value = 'test value'
    const program = Effect.gen(function* () {
      const stream = yield* LoadedResultStream.succeed<string, Error>(value)
      const current = yield* stream.get
      return current
    })

    const result = await Effect.runPromise(program)
    expect(result._tag).toBe('loaded')
    if (result._tag === 'loaded') {
      expect(result.value).toBe(value)
    }
  })

  test('map transforms the value in the stream', async () => {
    const program = Effect.gen(function* () {
      const source = yield* LoadedResultStream.succeed<number, Error>(5)
      const mapped = yield* pipe(
        source,
        LoadedResultStream.map((x) => x * 2)
      )
      const current = yield* mapped.get
      return current
    })

    const result = await Effect.runPromise(program)
    expect(result._tag).toBe('loaded')
    if (result._tag === 'loaded') {
      expect(result.value).toBe(10)
    }
  })

  test('map propagates updates from source stream', async () => {
    const program = Effect.gen(function* () {
      const source = yield* SubscriptionRef.make<LoadedResult<number, Error>>(
        LoadedResult.loaded(5)
      )
      const mapped = yield* pipe(
        source,
        LoadedResultStream.map((x) => x * 2)
      )

      // Update the source
      yield* SubscriptionRef.set(source, LoadedResult.loaded(10))
      
      // Allow time for the stream to propagate
      yield* Effect.sleep('10 millis')

      const current = yield* mapped.get
      return current
    })

    const result = await Effect.runPromise(program)
    expect(result._tag).toBe('loaded')
    if (result._tag === 'loaded') {
      expect(result.value).toBe(20)
    }
  })

  test('andThen chains loaded values into new streams', async () => {
    const program = Effect.gen(function* () {
      const source = yield* LoadedResultStream.succeed<number, Error>(5)
      const chained = yield* pipe(
        source,
        LoadedResultStream.andThen((x) =>
          Stream.succeed(LoadedResult.loaded<string, Error>(`Value: ${x}`))
        )
      )

      // Allow time for the stream to propagate
      yield* Effect.sleep('10 millis')

      const current = yield* chained.get
      return current
    })

    const result = await Effect.runPromise(program)
    expect(result._tag).toBe('loaded')
    if (result._tag === 'loaded') {
      expect(result.value).toBe('Value: 5')
    }
  })

  test('andThen handles loading state', async () => {
    const program = Effect.gen(function* () {
      const source = yield* SubscriptionRef.make<LoadedResult<number, Error>>(
        LoadedResult.loading()
      )
      const chained = yield* pipe(
        source,
        LoadedResultStream.andThen((x) =>
          Stream.succeed(LoadedResult.loaded<string, Error>(`Value: ${x}`))
        )
      )

      // Allow time for the stream to propagate
      yield* Effect.sleep('10 millis')

      const current = yield* chained.get
      return current
    })

    const result = await Effect.runPromise(program)
    expect(result._tag).toBe('loading')
  })

  test('andThen handles error state', async () => {
    const error = new Error('source error')
    const program = Effect.gen(function* () {
      const source = yield* SubscriptionRef.make<LoadedResult<number, Error>>(
        LoadedResult.error(error)
      )
      const chained = yield* pipe(
        source,
        LoadedResultStream.andThen((x) =>
          Stream.succeed(LoadedResult.loaded<string, Error>(`Value: ${x}`))
        )
      )

      // Allow time for the stream to propagate
      yield* Effect.sleep('10 millis')

      const current = yield* chained.get
      return current
    })

    const result = await Effect.runPromise(program)
    expect(result._tag).toBe('error')
    if (result._tag === 'error') {
      expect(result.error).toBe(error)
    }
  })
})
