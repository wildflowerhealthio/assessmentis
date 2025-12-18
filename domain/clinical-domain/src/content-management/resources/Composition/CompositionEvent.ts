import {
  BackboneElement,
  CodeableConcept,
  Period,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import { Schema } from 'effect'

const CompositionEventId = Schema.String.pipe(
  Schema.brand('CompositionEventId')
)
/**
 * The clinical service(s) being documented
 */

export const CompositionEvent = Schema.Struct({
  ...BackboneElement(CompositionEventId).fields,
  /**
   * Code(s) that apply to the event being documented
   */
  code: Schema.optional(Schema.Array(CodeableConcept)),
  /**
   * The period covered by the documentation
   */
  period: Schema.optional(Period),
  /**
   * The event(s) being documented
   */
  detail: Schema.optional(Schema.Array(Reference)),
})

export type CompositionEvent = typeof CompositionEvent.Type
