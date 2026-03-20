import { Data } from 'effect'

/** Tagged union of typed constraints on a single search field, generic over value type `V`. */
type Condition<V> = Data.TaggedEnum<{
  Exactly: { readonly value: V }
  AnyOf: { readonly values: readonly [V, V, ...V[]] }
}>

interface ConditionDefinition extends Data.TaggedEnum.WithGenerics<1> {
  readonly taggedEnum: Condition<this['A']>
}

/**
 * Raw TaggedEnum constructors — not exported directly. Use the convenience
 * constructors (Exactly, AnyOf) and pattern matching (match, is) instead.
 */
const _Condition = Data.taggedEnum<ConditionDefinition>()

/** Match a single exact value. Infers the value type `V` from the argument. */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- return type is inferred as the specific Exactly variant; annotating as Condition<V> would widen it and break downstream narrowing
const Exactly = <V>(value: V) => _Condition.Exactly({ value })

/** Match any of several values (OR semantics). Requires at least two values. */
// oxlint-disable-next-line typescript-eslint/explicit-function-return-type -- return type is inferred as the specific AnyOf variant; annotating as Condition<V> would widen it and break downstream narrowing
const AnyOf = <V>(values: readonly [V, V, ...V[]]) => _Condition.AnyOf({ values })

/** Exhaustive pattern matching over {@link Condition} variants. */
const match = _Condition.$match

/** Type guard for a specific {@link Condition} variant. */
const is = _Condition.$is

export type { Condition }
export { Exactly, AnyOf, match, is }
