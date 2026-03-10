import type { Subscribable } from 'effect'
import { Effect, Stream, SubscriptionRef, pipe } from 'effect'

export type LoadedResult<A, E> =
  | { _tag: 'loading' }
  | { _tag: 'error'; error: E }
  | { _tag: 'loaded'; value: A }

export const LoadedResult = {
  loading: <A, E>(): LoadedResult<A, E> => ({ _tag: 'loading' }),
  error: <A, E>(error: E): LoadedResult<A, E> => ({ _tag: 'error', error }),
  loaded: <A, E>(value: A): LoadedResult<A, E> => ({ _tag: 'loaded', value }),

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

export type LoadedResultStream<A, E> = Subscribable.Subscribable<
  LoadedResult<A, E>
>

export const LoadedResultStream = {
  succeed: <A, E>(value: A): Effect.Effect<LoadedResultStream<A, E>> =>
    SubscriptionRef.make<LoadedResult<A, E>>(LoadedResult.loaded<A, E>(value)),

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
