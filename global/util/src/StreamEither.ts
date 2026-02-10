/**
 * StreamEither — combinators for `Stream<Either<A, E>>` (perpetual streams with recoverable errors).
 *
 * These streams never terminate — errors are represented as `Either.Left` values
 * rather than in the stream's error channel. This module provides ergonomic
 * operations that work on the Either inside the stream.
 */
import { dual } from 'effect/Function'
import { Effect, Either, Stream } from 'effect'

// -------------------------------------------------------------------------------------
// mapping
// -------------------------------------------------------------------------------------

/**
 * Transforms the `Right` value of each element in the stream.
 */
export const map: {
  <A, B>(
    f: (a: A) => B
  ): <E, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>
  ) => Stream.Stream<Either.Either<B, E>, StreamErr, R>
  <A, B, E, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (a: A) => B
  ): Stream.Stream<Either.Either<B, E>, StreamErr, R>
} = dual(
  2,
  <A, B, E, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (a: A) => B
  ): Stream.Stream<Either.Either<B, E>, StreamErr, R> =>
    Stream.map(self, Either.map(f))
)

/**
 * Transforms the `Left` (error) value of each element in the stream.
 */
export const mapLeft: {
  <E, E2>(
    f: (e: E) => E2
  ): <A, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>
  ) => Stream.Stream<Either.Either<A, E2>, StreamErr, R>
  <A, E, E2, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (e: E) => E2
  ): Stream.Stream<Either.Either<A, E2>, StreamErr, R>
} = dual(
  2,
  <A, E, E2, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (e: E) => E2
  ): Stream.Stream<Either.Either<A, E2>, StreamErr, R> =>
    Stream.map(self, Either.mapLeft(f))
)

// -------------------------------------------------------------------------------------
// sequencing
// -------------------------------------------------------------------------------------

/**
 * FlatMaps the `Right` value into a new `Stream<Either<B, E2>>`.
 * `Left` values are propagated unchanged.
 *
 * Supports `{ switch: true }` to switch to the latest inner stream (like `Stream.flatMap`).
 */
export const flatMap: {
  <A, B, E2, R2>(
    f: (a: A) => Stream.Stream<Either.Either<B, E2>, never, R2>,
    options?: { readonly switch?: boolean; readonly concurrency?: number }
  ): <E, R>(
    self: Stream.Stream<Either.Either<A, E>, never, R>
  ) => Stream.Stream<Either.Either<B, E | E2>, never, R | R2>
  <A, B, E, E2, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, never, R>,
    f: (a: A) => Stream.Stream<Either.Either<B, E2>, never, R2>,
    options?: { readonly switch?: boolean; readonly concurrency?: number }
  ): Stream.Stream<Either.Either<B, E | E2>, never, R | R2>
} = dual(
  (args: IArguments) =>
    typeof args[0] === 'object' &&
    args[0] !== null &&
    (Stream.StreamTypeId in args[0] || Effect.EffectTypeId in args[0]),
  <A, B, E, E2, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, never, R>,
    f: (a: A) => Stream.Stream<Either.Either<B, E | E2>, never, R2>,
    options?: { readonly switch?: boolean; readonly concurrency?: number }
  ): Stream.Stream<Either.Either<B, E | E2>, never, R | R2> =>
    Stream.flatMap(
      self,
      (either) =>
        Either.match(either, {
          onRight: (a) => f(a),
          onLeft: (e) => Stream.succeed(Either.left<E | E2>(e)),
        }),
      options
    )
)

/**
 * Applies an effectful function to the `Right` value.
 * The effect's error channel is captured into the `Either.Left`.
 * `Left` values are propagated unchanged.
 */
export const mapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): <E, R>(
    self: Stream.Stream<Either.Either<A, E>, never, R>
  ) => Stream.Stream<Either.Either<B, E | E2>, never, R | R2>
  <A, B, E, E2, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, never, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): Stream.Stream<Either.Either<B, E | E2>, never, R | R2>
} = dual(
  2,
  <A, B, E, E2, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, never, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): Stream.Stream<Either.Either<B, E | E2>, never, R | R2> =>
    Stream.mapEffect(
      self,
      (either): Effect.Effect<Either.Either<B, E | E2>, never, R2> =>
        Either.match(either, {
          onRight: (a) => Effect.either(f(a)),
          onLeft: (e) => Effect.succeed(Either.left<E | E2>(e)),
        })
    )
)

// -------------------------------------------------------------------------------------
// side effects
// -------------------------------------------------------------------------------------

/**
 * Performs a side effect on `Right` values without modifying the stream.
 */
export const tapRight: {
  <A, X, R2>(
    f: (a: A) => Effect.Effect<X, never, R2>
  ): <E, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>
  ) => Stream.Stream<Either.Either<A, E>, StreamErr, R | R2>
  <A, E, X, StreamErr, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (a: A) => Effect.Effect<X, never, R2>
  ): Stream.Stream<Either.Either<A, E>, StreamErr, R | R2>
} = dual(
  2,
  <A, E, X, StreamErr, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (a: A) => Effect.Effect<X, never, R2>
  ): Stream.Stream<Either.Either<A, E>, StreamErr, R | R2> =>
    Stream.mapEffect(self, (either) =>
      Either.match(either, {
        onRight: (a) => Effect.as(f(a), Either.right(a) as Either.Either<A, E>),
        onLeft: (e) => Effect.succeed(Either.left(e) as Either.Either<A, E>),
      })
    )
)

/**
 * Performs a side effect on `Left` values without modifying the stream.
 */
export const tapLeft: {
  <E, X, R2>(
    f: (e: E) => Effect.Effect<X, never, R2>
  ): <A, StreamErr, R>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>
  ) => Stream.Stream<Either.Either<A, E>, StreamErr, R | R2>
  <A, E, X, StreamErr, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (e: E) => Effect.Effect<X, never, R2>
  ): Stream.Stream<Either.Either<A, E>, StreamErr, R | R2>
} = dual(
  2,
  <A, E, X, StreamErr, R, R2>(
    self: Stream.Stream<Either.Either<A, E>, StreamErr, R>,
    f: (e: E) => Effect.Effect<X, never, R2>
  ): Stream.Stream<Either.Either<A, E>, StreamErr, R | R2> =>
    Stream.mapEffect(
      self,
      (either): Effect.Effect<Either.Either<A, E>, never, R2> =>
        Either.match(either, {
          onRight: (a) => Effect.succeed(Either.right(a)),
          onLeft: (e) => Effect.as(f(e), Either.left(e)),
        })
    )
)

// -------------------------------------------------------------------------------------
// combining
// -------------------------------------------------------------------------------------

/**
 * Zips two `Stream<Either>` using `zipLatest`, combining errors.
 */
export const zipLatest: {
  <B, E2, R2>(
    right: Stream.Stream<Either.Either<B, E2>, never, R2>
  ): <A, E, R>(
    left: Stream.Stream<Either.Either<A, E>, never, R>
  ) => Stream.Stream<Either.Either<readonly [A, B], E | E2>, never, R | R2>
  <A, E, B, E2, R, R2>(
    left: Stream.Stream<Either.Either<A, E>, never, R>,
    right: Stream.Stream<Either.Either<B, E2>, never, R2>
  ): Stream.Stream<Either.Either<readonly [A, B], E | E2>, never, R | R2>
} = dual(
  2,
  <A, E, B, E2, R, R2>(
    left: Stream.Stream<Either.Either<A, E>, never, R>,
    right: Stream.Stream<Either.Either<B, E2>, never, R2>
  ): Stream.Stream<Either.Either<readonly [A, B], E | E2>, never, R | R2> =>
    Stream.zipLatestWith(left, right, (a, b) => Either.all([a, b] as const))
)

/**
 * Zips two `Stream<Either>` using `zipLatest` and maps the result.
 */
export const zipLatestWith: {
  <A, B, C, E2, R2>(
    right: Stream.Stream<Either.Either<B, E2>, never, R2>,
    f: (a: A, b: B) => C
  ): <E, R>(
    left: Stream.Stream<Either.Either<A, E>, never, R>
  ) => Stream.Stream<Either.Either<C, E | E2>, never, R | R2>
  <A, E, B, E2, C, R, R2>(
    left: Stream.Stream<Either.Either<A, E>, never, R>,
    right: Stream.Stream<Either.Either<B, E2>, never, R2>,
    f: (a: A, b: B) => C
  ): Stream.Stream<Either.Either<C, E | E2>, never, R | R2>
} = dual(
  3,
  <A, E, B, E2, C, R, R2>(
    left: Stream.Stream<Either.Either<A, E>, never, R>,
    right: Stream.Stream<Either.Either<B, E2>, never, R2>,
    f: (a: A, b: B) => C
  ): Stream.Stream<Either.Either<C, E | E2>, never, R | R2> =>
    Stream.zipLatestWith(left, right, (a, b) =>
      Either.all([a, b] as const).pipe(Either.map(([a, b]) => f(a, b)))
    )
)

// -------------------------------------------------------------------------------------
// conversions
// -------------------------------------------------------------------------------------

/**
 * Converts a `Stream<Either<A, E>>` to `Stream<A, E>`.
 * Left values become stream failures (which will terminate the stream).
 *
 * Equivalent to `Stream.absolve`, but named for discoverability within this module.
 */
export const unwrap = <A, E, StreamErr, R>(
  self: Stream.Stream<Either.Either<A, E>, StreamErr, R>
): Stream.Stream<A, E | StreamErr, R> =>
  Stream.flatMap(self, (either) =>
    Either.match(either, {
      onRight: (a) => Stream.succeed(a),
      onLeft: (e) => Stream.fail(e),
    })
  )
