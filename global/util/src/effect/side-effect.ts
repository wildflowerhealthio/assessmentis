import type { Effect } from 'effect'

/**
 * A lightweight container that pairs a pure value with deferred
 * side-effectful actions.
 *
 * `SideEffect<A>` holds a synchronous `value` of type `A` together with an
 * ordered list of `Effect<void>` actions that should be executed later.
 * This lets pure transformation pipelines accumulate side effects without
 * running them immediately, preserving referential transparency until the
 * caller is ready to execute the collected actions.
 */
export namespace SideEffect {
  /** A deferred, infallible, context-free side effect. */
  export type EffectAction = Effect.Effect<void, never>

  /** A value `A` paired with deferred side-effectful actions. */
  export interface SideEffect<out A> {
    value: A
    actions: readonly EffectAction[]
  }

  /**
   * Transforms the value inside a `SideEffect` while preserving its
   * accumulated actions.
   */
  export const map =
    <A, B>(f: (r: A) => B) =>
    (effect: SideEffect<A>): SideEffect<B> => ({
      actions: effect.actions,
      value: f(effect.value),
    })

  /**
   * Chains a function that produces a new `SideEffect`, concatenating
   * the actions from both the original and the produced `SideEffect`.
   */
  export const flatMap =
    <A1, A2>(f: (r: A1) => SideEffect<A2>) =>
    (effect: SideEffect<A1>): SideEffect<A2> => {
      const e = f(effect.value)
      return {
        actions: [...effect.actions, ...e.actions],
        value: e.value,
      }
    }

  /**
   * Lifts a plain value into a `SideEffect` with no actions (or the
   * provided actions list).
   */
  export const of = <A>(value: A, actions: readonly EffectAction[] = []): SideEffect<A> => ({
    actions,
    value,
  })

  /**
   * Extracts the accumulated actions from a `SideEffect`, discarding the
   * value.
   */
  export const justActions = <A>(effect: SideEffect<A>): readonly EffectAction[] => effect.actions
}
