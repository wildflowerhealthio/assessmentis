import type { Effect } from 'effect'

/**
 * A lightweight container that pairs a pure value with deferred
 * side-effectful actions.
 *
 * `DeferredActionWriter<A>` holds a synchronous `value` of type `A` together with an
 * ordered list of `Effect<void>` actions that should be executed later.
 * This lets pure transformation pipelines accumulate side effects without
 * running them immediately, preserving referential transparency until the
 * caller is ready to execute the collected actions.
 */
export namespace DeferredActionWriter {
  /** A deferred, infallible, context-free side effect. */
  export type Action = Effect.Effect<void, never>

  /** A value `A` paired with deferred side-effectful actions. */
  export interface DeferredActionWriter<out A> {
    value: A
    actions: readonly Action[]
  }

  /**
   * Transforms the value inside a `DeferredActionWriter` while preserving its
   * accumulated actions.
   */
  export const map =
    <A, B>(f: (r: A) => B) =>
    (effect: DeferredActionWriter<A>): DeferredActionWriter<B> => ({
      actions: effect.actions,
      value: f(effect.value),
    })

  /**
   * Chains a function that produces a new `DeferredActionWriter`, concatenating
   * the actions from both the original and the produced `DeferredActionWriter`.
   */
  export const flatMap =
    <A1, A2>(f: (r: A1) => DeferredActionWriter<A2>) =>
    (effect: DeferredActionWriter<A1>): DeferredActionWriter<A2> => {
      const e = f(effect.value)
      return {
        actions: [...effect.actions, ...e.actions],
        value: e.value,
      }
    }

  /**
   * Lifts a plain value into a `DeferredActionWriter` with no actions (or the
   * provided actions list).
   */
  export const of = <A>(value: A, actions: readonly Action[] = []): DeferredActionWriter<A> => ({
    actions,
    value,
  })

  /**
   * Extracts the accumulated actions from a `DeferredActionWriter`, discarding the
   * value.
   */
  export const justActions = <A>(effect: DeferredActionWriter<A>): readonly Action[] =>
    effect.actions
}
