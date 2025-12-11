import { Stream } from 'effect'

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
}

export type LoadedResultStream<A, E> = Stream.Stream<LoadedResult<A, E>>

export const LoadedResultStream = {
  succeed: <A, E>(value: A): LoadedResultStream<A, E> =>
    Stream.succeed(LoadedResult.loaded<A, E>(value)),

  map:
    <A, B, E>(f: (a: A) => B) =>
    (source: LoadedResultStream<A, E>): LoadedResultStream<B, E> =>
      source.pipe(Stream.map(LoadedResult.map(f))),
  andThen:
    <A, E, A1>(f: (a: A) => Stream.Stream<A1, E>) =>
    (source: LoadedResultStream<A, E>): LoadedResultStream<A1, E> =>
      source.pipe(
        Stream.flatMap(
          (lr) => {
            switch (lr._tag) {
              case 'loading':
                return Stream.succeed(LoadedResult.loading<A1, E>())
              case 'error':
                return Stream.succeed(LoadedResult.error<A1, E>(lr.error))
              case 'loaded':
                return Stream.concat(
                  Stream.succeed(LoadedResult.loading<A1, E>()),
                  f(lr.value).pipe(
                    Stream.map((a1) => LoadedResult.loaded<A1, E>(a1)),
                    Stream.catchAll((error) =>
                      Stream.succeed(LoadedResult.error<A1, E>(error))
                    )
                  )
                )
            }
          },
          { switch: true }
        )
        //  Stream.buffer({ capacity: 1, strategy: 'sliding' })
      ),
}
