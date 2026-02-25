import { Schema } from 'effect'
import { applySchemaMixinTo } from '@assessmentis/util'
import { Element, type ElementEncoded } from '../base/Element'

export const Key = 'Quantity'
export type Key = typeof Key

const fields = {
  /**
   * The implicit precision in the value should always be honored. Monetary values have their own rules for handling precision (refer to standard accounting text books).
   */
  value: Schema.optional(Schema.Number),
  /**
   * A human-readable form of the unit.
   */
  unit: Schema.optional(Schema.String),
  /**
   * The identification of the system that provides the coded form of the unit.
   * The preferred system is UCUM, but SNOMED CT can also be used (for customary units) or ISO 4217 for currency.
   * The context of use may additionally require a code from a particular system.
   */
  system: Schema.optional(Schema.String),
  /**
   * A computer processable form of the unit in some unit representation system.
   */
  code: Schema.optional(Schema.String),
  /**
   * How the value should be understood and represented - whether the actual value is greater or less than
   * the stated value due to measurement issues; e.g. if the comparator is "<", then the real value is < stated value.
   */
  comparator: Schema.optional(
    Schema.Union(
      Schema.Literal('<'),
      Schema.Literal('<='),
      Schema.Literal('>='),
      Schema.Literal('>')
    )
  ),
} as const satisfies Schema.Struct.Fields

const elementMixin = Element(Key)

export interface QuantityEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<Key> {}

/**
 * A measured amount (or an amount that can potentially be measured).
 *
 * Note that measured amounts include amounts that are not precisely quantified, including amounts
 * involving arbitrary units and floating currencies.
 *
 * The context of use may frequently define what kind of quantity this is and therefore what kind
 * of units can be used. The context of use may also restrict the values for the comparator.
 */

class Quantity extends Schema.Class<Quantity>(Key)({
  ...elementMixin.fields,
  ...fields,
}) {}

const QuantityWithMixin = applySchemaMixinTo(Quantity, elementMixin)

type QuantityWithMixin = Quantity

export { QuantityWithMixin as Quantity }
