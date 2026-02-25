import { Schema } from 'effect'
import type { ElementEncoded } from '../base/Element'
import { Element } from '../base/Element'
import * as Quantity from './Quantity'

export const Key = 'Range'
export type Key = typeof Key

const fields = {
  /**
   * The low limit. The boundary is inclusive.
   */
  low: Schema.optional(Quantity.Quantity),
  /**
   * The high limit. The boundary is inclusive.
   */
  high: Schema.optional(Quantity.Quantity),
} as const satisfies Schema.Struct.Fields

export interface RangeEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<Key> {}

/**
 * A set of ordered Quantities defined by a low and high limit.
 *
 * A Range specifies a set of possible values; usually, one value from the range applies
 * (e.g. "give the patient between 2 and 4 tablets"). Ranges are typically used in instructions.
 */
export class Range extends Schema.Class<Range>(Key)({
  ...Element(Key).fields,
  ...fields,
}) {
  public static readonly Key = Key
}
