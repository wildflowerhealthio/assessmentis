import { Effect, Stream, SubscriptionRef, pipe } from 'effect'
import type { Subscribable } from 'effect'

/**
 * A three-state discriminated union representing an async value that is
 * either loading, failed, or successfully loaded. Used throughout the UI
 * layer to model data-fetching lifecycles without `null`/`undefined` ambiguity.
 *
 * @typeParam A - The type of the successfully loaded value
 * @typeParam E - The error type on failure
 */
export type LoadedResult<A, E> =
  | { _tag: 'loading' }
  | { _tag: 'error'; error: E }
  | { _tag: 'loaded'; value: A }

/** Constructors and operators for {@link LoadedResult}. */
export const LoadedResult = {
  /** Create a `loading` state. */
  loading: <A, E>(): LoadedResult<A, E> => ({ _tag: 'loading' }),
  /** Create an `error` state wrapping the given error. */
  error: <A, E>(error: E): LoadedResult<A, E> => ({ _tag: 'error', error }),
  /** Create a `loaded` state wrapping the given value. */
  loaded: <A, E>(value: A): LoadedResult<A, E> => ({ _tag: 'loaded', value }),

  /**
   * Transform the loaded value while preserving loading/error states.
   * Pipeable — designed for use with `pipe(result, LoadedResult.map(f))`.
   */
  map:
    <A, B, E>(f: (a: A) => B) =>
    (lr: LoadedResult<A, E>): LoadedResult<B, E> => {
      switch (lr._tag) {
        case 'loading': {
          return LoadedResult.loading<B, E>()
        }
        case 'error': {
          return LoadedResult.error<B, E>(lr.error)
        }
        case 'loaded': {
          return LoadedResult.loaded<B, E>(f(lr.value))
        }
      }
    },

  /**
   * Exhaustively pattern-match on all three states with a handler object.
   *
   * @param handlers - One branch per state: `onLoading`, `onError`, `onSuccess`.
   *   Note: the success branch is `onSuccess` (not `onLoaded`) for consistency
   *   with Effect's naming conventions.
   * @returns The value produced by whichever branch matches `lr`.
   */
  handle: <A, E, O>(
    lr: LoadedResult<A, E>,
    handlers: {
      onLoading: () => O
      onError: (e: E) => O
      onSuccess: (a: A) => O
    }
  ): O => {
    if (lr._tag === 'loading') {
      return handlers.onLoading()
    }
    if (lr._tag === 'error') {
      return handlers.onError(lr.error)
    }
    return handlers.onSuccess(lr.value)
  },
}

/**
 * A reactive variant of {@link LoadedResult}: an Effect `Subscribable` that
 * emits `LoadedResult<A, E>` values over time, allowing consumers to observe
 * loading → loaded/error transitions.
 *
 * @typeParam A - The type of the successfully loaded value
 * @typeParam E - The error type on failure
 */
export type LoadedResultStream<A, E> = Subscribable.Subscribable<LoadedResult<A, E>>

/** Constructors and operators for {@link LoadedResultStream}. */
export const LoadedResultStream = {
  /**
   * Returns an `Effect` that creates a stream already in the `loaded` state.
   * The resulting `Effect` must be run to obtain the `LoadedResultStream`.
   */
  succeed: <A, E>(value: A): Effect.Effect<LoadedResultStream<A, E>> =>
    SubscriptionRef.make<LoadedResult<A, E>>(LoadedResult.loaded<A, E>(value)),

  /**
   * Derives a new stream by mapping loaded values. Loading/error states
   * pass through unchanged.
   *
   * @typeParam A - The source loaded value type
   * @typeParam B - The mapped loaded value type
   * @typeParam E - The shared error type
   *
   * @remarks
   * Forks a daemon fiber that forwards updates from `source` into a new
   * `SubscriptionRef`. The initial value is mapped synchronously; subsequent
   * changes are propagated asynchronously via the fiber.
   */
  map:
    <A, B, E>(f: (a: A) => B) =>
    (source: LoadedResultStream<A, E>): Effect.Effect<LoadedResultStream<B, E>, never> =>
      Effect.gen(function* map() {
        const initial = yield* source.get
        const mappedRef = yield* SubscriptionRef.make<LoadedResult<B, E>>(
          // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: LoadedResult.map is not an array method
          pipe(initial, LoadedResult.map(f))
        )

        yield* Effect.forkDaemon(
          source.changes.pipe(
            // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: LoadedResult.map is not an array method
            Stream.runForEach((a) => SubscriptionRef.set(mappedRef, pipe(a, LoadedResult.map(f))))
          )
        )
        return mappedRef
      }),
  /**
   * Flat-map over the loaded value to produce a dependent stream. When the
   * source transitions to a new loaded value, the previous inner stream is
   * cancelled and replaced by `f(newValue)`.
   *
   * @typeParam A1 - The loaded value type of the resulting stream
   * @param f - Produces a `Stream<LoadedResult<A1, E>>` from a loaded `A`
   *
   * @remarks
   * Uses `Stream.flatMap` with `{ switch: true }`, so only the latest inner
   * stream is active at any time. Loading/error states from the source
   * propagate directly — `f` is only invoked on `loaded` values.
   * The result stream starts in the `loading` state and is backed by a
   * daemon fiber, matching the lifecycle of {@link LoadedResultStream.map}.
   */
  andThen:
    <A, E, A1>(f: (a: A) => Stream.Stream<LoadedResult<A1, E>>) =>
    (source: LoadedResultStream<A, E>): Effect.Effect<LoadedResultStream<A1, E>> =>
      Effect.gen(function* andThen() {
        const mappedRef = yield* SubscriptionRef.make<LoadedResult<A1, E>>(
          LoadedResult.loading<A1, E>()
        )
        yield* Effect.forkDaemon(
          source.changes.pipe(
            Stream.flatMap(
              (lr): Stream.Stream<LoadedResult<A1, E>> => {
                switch (lr._tag) {
                  case 'loading': {
                    return Stream.succeed(LoadedResult.loading<A1, E>())
                  }
                  case 'error': {
                    return Stream.succeed(LoadedResult.error<A1, E>(lr.error))
                  }
                  case 'loaded': {
                    return f(lr.value).pipe(
                      Stream.map((a1) => {
                        if (a1._tag === 'loaded') {
                          return LoadedResult.loaded<A1, E>(a1.value)
                        }
                        if (a1._tag === 'error') {
                          return LoadedResult.error<A1, E>(a1.error)
                        }
                        return LoadedResult.loading<A1, E>()
                      })
                    )
                  }
                }
              },
              { switch: true }
            ),
            Stream.runForEach((a1) => SubscriptionRef.set(mappedRef, a1))
          )
        )
        return mappedRef
      }),
}
