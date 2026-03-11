import { Effect } from 'effect'

/**
 * Narrows a value with a type-guard predicate, failing with `makeErr(val)`
 * when the guard returns false. Returns a pipeable `(val) => Effect<AOut, EOut>`.
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
 */
export const refineEffectOrFail = <EOut, AIn, AOut extends AIn, R = never>(
  cond: (a: AIn) => a is AOut,
  makeErr: (a: AIn) => EOut
) => Effect.flatMap<AIn, AOut, EOut, R>(refineOrFail(cond, makeErr))

/**
 * Fails the Effect when `cond` returns false. Unlike {@link refineOrFail},
 * does not narrow the type — the output type stays `A`.
 */
export const failUnless = <E, A>(
  cond: (a: A) => boolean,
  makeErr: (a: A) => E
) => refineOrFail<E, A, A>(cond as (a: A) => a is A, makeErr)

/** Inverse of {@link failUnless} — fails the Effect when `cond` returns true. */
export const failIf = <E, A>(cond: (a: A) => boolean, makeErr: (a: A) => E) =>
  refineOrFail<E, A, A>(((a: A) => !cond(a)) as (a: A) => a is A, makeErr)

/** Like {@link failUnless} but for use inside `Effect.flatMap` chains. */
export const failEffectUnless = <E, A, R = never>(
  cond: (a: A) => boolean,
  makeErr: (a: A) => E
) => refineEffectOrFail<E, A, A, R>(cond as (a: A) => a is A, makeErr)
