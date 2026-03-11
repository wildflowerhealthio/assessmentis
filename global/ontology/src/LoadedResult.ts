import {
  Effect,
  pipe,
  Stream,
  SubscriptionRef,
  type Subscribable,
} from 'effect'

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

/** Constructors and combinators for {@link LoadedResult}. */
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
        case 'loading':
          return LoadedResult.loading<B, E>()
        case 'error':
          return LoadedResult.error<B, E>(lr.error)
        case 'loaded':
          return LoadedResult.loaded<B, E>(f(lr.value))
      }
    },

  /** Exhaustively pattern-match on all three states with a handler object. */
  handle: <A, E, O>(
    lr: LoadedResult<A, E>,
    handlers: {
      onLoading: () => O
      onError: (e: E) => O
      onSuccess: (a: A) => O
    }
  ) => {
    if (lr._tag === 'loading') {
      return handlers.onLoading()
    } else if (lr._tag === 'error') {
      return handlers.onError(lr.error)
    } else {
      return handlers.onSuccess(lr.value)
    }
  },
}

/**
 * A subscribable (reactive) variant of {@link LoadedResult}. Wraps an
 * Effect `Subscribable` so consumers can observe loading → loaded/error
 * transitions over time.
 */
export type LoadedResultStream<A, E> = Subscribable.Subscribable<
  LoadedResult<A, E>
>

/** Constructors and combinators for {@link LoadedResultStream}. */
export const LoadedResultStream = {
  /** Create a stream that is immediately in the `loaded` state with the given value. */
  succeed: <A, E>(value: A): Effect.Effect<LoadedResultStream<A, E>> =>
    SubscriptionRef.make<LoadedResult<A, E>>(LoadedResult.loaded<A, E>(value)),

  /**
   * Derive a new stream by mapping loaded values. Loading/error states
   * pass through unchanged. Internally forks a daemon fiber to propagate
   * updates from the source.
   */
  map:
    <A, B, E>(f: (a: A) => B) =>
    (
      source: LoadedResultStream<A, E>
    ): Effect.Effect<LoadedResultStream<B, E>, never, never> =>
      Effect.gen(function* () {
        const initial = yield* source.get
        const mappedRef = yield* SubscriptionRef.make<LoadedResult<B, E>>(
          pipe(initial, LoadedResult.map(f))
        )

        yield* Effect.forkDaemon(
          source.changes.pipe(
            Stream.runForEach((a) =>
              SubscriptionRef.set(mappedRef, pipe(a, LoadedResult.map(f)))
            )
          )
        )
        return mappedRef
      }),
  /**
   * Flat-map over the loaded value to produce a dependent stream. When the
   * source transitions to a new loaded value, the previous inner stream is
   * cancelled (`switch` semantics) and replaced by `f(newValue)`.
   */
  andThen:
    <A, E, A1>(f: (a: A) => Stream.Stream<LoadedResult<A1, E>>) =>
    (
      source: LoadedResultStream<A, E>
    ): Effect.Effect<LoadedResultStream<A1, E>> =>
      Effect.gen(function* () {
        const mappedRef = yield* SubscriptionRef.make<LoadedResult<A1, E>>(
          LoadedResult.loading<A1, E>()
        )
        yield* Effect.forkDaemon(
          source.changes.pipe(
            Stream.flatMap(
              (lr): Stream.Stream<LoadedResult<A1, E>> => {
                switch (lr._tag) {
                  case 'loading':
                    return Stream.succeed(LoadedResult.loading<A1, E>())
                  case 'error':
                    return Stream.succeed(LoadedResult.error<A1, E>(lr.error))
                  case 'loaded':
                    return f(lr.value).pipe(
                      Stream.map((a1) => {
                        if (a1._tag === 'loaded') {
                          return LoadedResult.loaded<A1, E>(a1.value)
                        } else if (a1._tag === 'error') {
                          return LoadedResult.error<A1, E>(a1.error)
                        } else {
                          return LoadedResult.loading<A1, E>()
                        }
                      })
                    )
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
