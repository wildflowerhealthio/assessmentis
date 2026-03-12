import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { Element, type ElementEncoded } from '../base/Element'
import { Quantity } from './Quantity'

const DomainType = 'Range'

const fields = {
  /**
   * The low limit. The boundary is inclusive.
   */
  low: Schema.optional(Quantity),
  /**
   * The high limit. The boundary is inclusive.
   */
  high: Schema.optional(Quantity),
} as const satisfies Schema.Struct.Fields

const ElementMixin = Element(DomainType)

/** Encoded (wire-format) shape of a {@link Range}. */
export interface RangeEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    ElementEncoded<typeof DomainType> {}

/**
 * A set of ordered Quantities defined by a low and high limit.
 *
 * A Range specifies a set of possible values; usually, one value from the range applies
 * (e.g. "give the patient between 2 and 4 tablets"). Ranges are typically used in instructions.
 */
export class Range extends MergeClasses<Range>(DomainType)(
  [],
  ElementMixin,
  fields
) {}
