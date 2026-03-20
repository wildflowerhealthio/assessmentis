import { Data } from 'effect'

type ConditionDef = {
  Exactly: { readonly value: string }
  AnyOf: { readonly values: readonly [string, string, ...string[]] }
}

/** Tagged union of typed constraints on a single search field. */
type Condition = Data.TaggedEnum<ConditionDef>

const _Condition = Data.taggedEnum<Condition>()

/** Match a single exact value. */
const Exactly = (value: string): Data.TaggedEnum.Value<Condition, 'Exactly'> =>
  _Condition.Exactly({ value })

/** Match any of several values (OR semantics). Requires at least two values. */
const AnyOf = (
  values: readonly [string, string, ...string[]]
): Data.TaggedEnum.Value<Condition, 'AnyOf'> => _Condition.AnyOf({ values })

/** Exhaustive pattern matching over {@link Condition} variants. */
const match = _Condition.$match

/** Type guard for a specific {@link Condition} variant. */
const is = _Condition.$is

export type { Condition }
export { Exactly, AnyOf, match, is }
