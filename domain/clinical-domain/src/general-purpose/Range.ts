import { Schema } from 'effect'
import { Element } from './Element'
import { SimpleQuantity } from '../diagnostic-medicine/models'

export const RangeId = Schema.String.pipe(Schema.brand('RangeId'))

export type RangeId = typeof RangeId.Type

/**
 * A set of ordered Quantities defined by a low and high limit.
 *
 * A Range specifies a set of possible values; usually, one value from the range applies
 * (e.g. "give the patient between 2 and 4 tablets"). Ranges are typically used in instructions.
 */
export const Range = Schema.Struct({
  ...Element(RangeId).fields,
  /**
   * The low limit. The boundary is inclusive.
   */
  low: Schema.optional(SimpleQuantity),
  /**
   * The high limit. The boundary is inclusive.
   */
  high: Schema.optional(SimpleQuantity),
})

export type Range = typeof Range.Type
