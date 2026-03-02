import { Effect } from 'effect'

export type EffectAction = Effect.Effect<void, never, never>

export interface SideEffect<out A> {
  value: A
  actions: ReadonlyArray<EffectAction>
}

export const map =
  <A, B>(f: (r: A) => B) =>
  (effect: SideEffect<A>): SideEffect<B> => ({
    value: f(effect.value),
    actions: effect.actions,
  })

export const flatMap =
  <A1, A2>(f: (r: A1) => SideEffect<A2>) =>
  (effect: SideEffect<A1>): SideEffect<A2> => {
    const e = f(effect.value)
    return {
      value: e.value,
      actions: [...effect.actions, ...e.actions],
    }
  }

export const of = <A>(
  value: A,
  actions: ReadonlyArray<EffectAction> = []
): SideEffect<A> => ({
  value,
  actions,
})
