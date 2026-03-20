import * as fc from 'fast-check'

import type { ReadonlyUrl } from '../readonly-url'
import { wellFormedUrlArb } from '../readonly-url.arbitrary'
import type { Condition } from './condition'
import { AnyOf, Exactly } from './condition'

/** Arbitrary for condition values — either a plain string or a ReadonlyUrl. */
const conditionValueArb: fc.Arbitrary<string | ReadonlyUrl> = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  wellFormedUrlArb
)

/** Arbitrary for string-only condition values. */
const stringValueArb = fc.string({ minLength: 1, maxLength: 20 })

/** Arbitrary for a SearchCondition over string | ReadonlyUrl values. */
const conditionArb: fc.Arbitrary<Condition<string | ReadonlyUrl>> = fc.oneof(
  conditionValueArb.map(Exactly),
  fc
    .array(conditionValueArb, { minLength: 2, maxLength: 4 })
    .map((vs) =>
      AnyOf(vs as [string | ReadonlyUrl, string | ReadonlyUrl, ...(string | ReadonlyUrl)[]])
    )
)

/** Arbitrary for a SearchCondition over string values only. */
const stringConditionArb: fc.Arbitrary<Condition<string>> = fc.oneof(
  stringValueArb.map(Exactly),
  fc
    .array(stringValueArb, { minLength: 2, maxLength: 4 })
    .map((vs) => AnyOf(vs as [string, string, ...string[]]))
)

export { conditionValueArb, stringValueArb, conditionArb, stringConditionArb }
