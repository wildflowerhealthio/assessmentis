import * as fc from 'fast-check'

import type { ReadonlyUrl } from '../readonly-url'
import { wellFormedUrlArb } from '../readonly-url.arbitrary'
import type { Condition } from './condition'
import { AnyOf, Exactly } from './condition'

/**
 * Build an Exactly arbitrary from any value arbitrary.
 * Use to create condition arbitraries for specific branded URL types.
 */
const exactlyArb = <V>(valueArb: fc.Arbitrary<V>): fc.Arbitrary<Condition<V>> =>
  valueArb.map((v) => Exactly(v))

/**
 * Build an AnyOf arbitrary from any value arbitrary. Generates 2–4 values.
 */
const anyOfArb = <V>(valueArb: fc.Arbitrary<V>): fc.Arbitrary<Condition<V>> =>
  fc
    .tuple(valueArb, valueArb, fc.array(valueArb, { maxLength: 2 }))
    .map(([first, second, rest]) => AnyOf([first, second, ...rest]))

/**
 * Build a Condition arbitrary from any value arbitrary.
 * Produces either Exactly or AnyOf with equal probability.
 */
const conditionArbFrom = <V>(valueArb: fc.Arbitrary<V>): fc.Arbitrary<Condition<V>> =>
  fc.oneof(exactlyArb(valueArb), anyOfArb(valueArb))

/** Arbitrary for string-only condition values. */
const stringValueArb = fc.string({ minLength: 1, maxLength: 20 })

/** Arbitrary for condition values — either a plain string or a ReadonlyUrl. */
const conditionValueArb: fc.Arbitrary<string | ReadonlyUrl> = fc.oneof(
  stringValueArb,
  wellFormedUrlArb
)

/** Arbitrary for a SearchCondition over string values only. */
const stringConditionArb: fc.Arbitrary<Condition<string>> = conditionArbFrom(stringValueArb)

/** Arbitrary for a SearchCondition over string | ReadonlyUrl values. */
const conditionArb: fc.Arbitrary<Condition<string | ReadonlyUrl>> =
  conditionArbFrom(conditionValueArb)

export {
  exactlyArb,
  anyOfArb,
  conditionArbFrom,
  stringValueArb,
  conditionValueArb,
  stringConditionArb,
  conditionArb,
}
