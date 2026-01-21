import { Effect } from 'effect'

export const refineOrFail =
  <EOut, AIn, AOut extends AIn>(
    cond: (a: AIn) => a is AOut,
    makeErr: (a: AIn) => EOut
  ) =>
  (val: AIn): Effect.Effect<AOut, EOut, never> =>
    cond(val) ? Effect.succeed(val) : Effect.fail(makeErr(val))

export const refineEffectOrFail = <EOut, AIn, AOut extends AIn, R = never>(
  cond: (a: AIn) => a is AOut,
  makeErr: (a: AIn) => EOut
) => Effect.flatMap<AIn, AOut, EOut, R>(refineOrFail(cond, makeErr))

export const failUnless = <E, A>(
  cond: (a: A) => boolean,
  makeErr: (a: A) => E
) => refineOrFail<E, A, A>(cond as (a: A) => a is A, makeErr)

export const failEffectUnless = <E, A, R = never>(
  cond: (a: A) => boolean,
  makeErr: (a: A) => E
) => refineEffectOrFail<E, A, A, R>(cond as (a: A) => a is A, makeErr)
