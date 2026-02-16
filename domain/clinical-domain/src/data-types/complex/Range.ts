import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import { ElementFromFhirR4 } from '../base/Element'
import { type Quantity, QuantityFromFhirR4 } from './Quantity'
import type { Element } from '../base/Element'

export const RangeId = Schema.String.pipe(Schema.brand('RangeId'))

export type RangeId = typeof RangeId.Type

export interface Range extends Element<RangeId> {
  /**
   * The low limit. The boundary is inclusive.
   */
  low?: Quantity
  /**
   * The high limit. The boundary is inclusive.
   */
  high?: Quantity
}
/**
 * A set of ordered Quantities defined by a low and high limit.
 *
 * A Range specifies a set of possible values; usually, one value from the range applies
 * (e.g. "give the patient between 2 and 4 tablets"). Ranges are typically used in instructions.
 */
export const Range: Schema.Schema<Range, fhir.Range, never> = Schema.extend(
  ElementFromFhirR4(RangeId),
  Schema.mutable(
    Schema.Struct({
      /**
       * The low limit. The boundary is inclusive.
       */
      low: Schema.optional(QuantityFromFhirR4),
      /**
       * The high limit. The boundary is inclusive.
       */
      high: Schema.optional(QuantityFromFhirR4),
    })
  )
)
