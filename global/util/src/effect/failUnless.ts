import { Effect } from 'effect'

/**
 * Narrows a value with a type-guard predicate, failing with `makeErr(val)`
 * when the guard returns false. Returns a pipeable `(val) => Effect<AOut, EOut>`.
 *
 * @deprecated Use {@link Effect.liftPredicate} instead, which accepts a type-guard
 * predicate and error-constructor in the same position:
 * ```ts
 * // Before
 * pipe(val, refineOrFail(isString, (a) => new MyError(a)))
 * // After
 * Effect.liftPredicate(val, isString, (a) => new MyError(a))
 * // or curried form
 * pipe(val, Effect.liftPredicate(isString, (a) => new MyError(a)))
 * ```
 */
export const refineOrFail =
  <EOut, AIn, AOut extends AIn>(
    cond: (a: AIn) => a is AOut,
    makeErr: (a: AIn) => EOut
  ) =>
  (val: AIn): Effect.Effect<AOut, EOut, never> =>
    cond(val) ? Effect.succeed(val) : Effect.fail(makeErr(val))

/**
 * Like {@link refineOrFail} but designed for use inside `Effect.flatMap` chains.
 * Applies the type-guard refinement to the success channel of an Effect.
 *
 * @deprecated Use {@link Effect.filterOrFail} instead, which is directly pipeable
 * and accepts a type-guard predicate:
 * ```ts
 * // Before
 * pipe(effect, refineEffectOrFail(isString, (a) => new MyError(a)))
 * // After
 * pipe(effect, Effect.filterOrFail(isString, (a) => new MyError(a)))
 * ```
 */
export const refineEffectOrFail = <EOut, AIn, AOut extends AIn, R = never>(
  cond: (a: AIn) => a is AOut,
  makeErr: (a: AIn) => EOut
) => Effect.flatMap<AIn, AOut, EOut, R>(refineOrFail(cond, makeErr))

/**
 * Fails the Effect when `cond` returns false. Unlike {@link refineOrFail},
 * does not narrow the type — the output type stays `A`.
 *
 * @deprecated Use {@link Effect.liftPredicate} instead:
 * ```ts
 * // Before
 * pipe(val, failUnless((a) => a > 0, (a) => new MyError(a)))
 * // After
 * Effect.liftPredicate(val, (a) => a > 0, (a) => new MyError(a))
 * // or curried form
 * pipe(val, Effect.liftPredicate((a) => a > 0, (a) => new MyError(a)))
 * ```
 */
export const failUnless = <E, A>(
  cond: (a: A) => boolean,
  makeErr: (a: A) => E
) => refineOrFail<E, A, A>(cond as (a: A) => a is A, makeErr)

/**
 * Inverse of {@link failUnless} — fails the Effect when `cond` returns true.
 *
 * @deprecated Use {@link Effect.liftPredicate} with a negated predicate instead:
 * ```ts
 * // Before
 * pipe(val, failIf((a) => a < 0, (a) => new MyError(a)))
 * // After
 * pipe(val, Effect.liftPredicate((a) => !(a < 0), (a) => new MyError(a)))
 * ```
 */
export const failIf = <E, A>(cond: (a: A) => boolean, makeErr: (a: A) => E) =>
  refineOrFail<E, A, A>(((a: A) => !cond(a)) as (a: A) => a is A, makeErr)

/**
 * Like {@link failUnless} but for use inside `Effect.flatMap` chains.
 *
 * @deprecated Use {@link Effect.filterOrFail} instead, which is directly pipeable:
 * ```ts
 * // Before
 * pipe(effect, failEffectUnless((a) => a > 0, (a) => new MyError(a)))
 * // After
 * pipe(effect, Effect.filterOrFail((a) => a > 0, (a) => new MyError(a)))
 * ```
 */
export const failEffectUnless = <E, A, R = never>(
  cond: (a: A) => boolean,
  makeErr: (a: A) => E
) => refineEffectOrFail<E, A, A, R>(cond as (a: A) => a is A, makeErr)
