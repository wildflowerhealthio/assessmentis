import { Schema } from 'effect'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import { Reference } from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Period } from '../../data-types/complex/Period'

/**
 * The clinical service(s) being documented
 */
export const CompositionEventSchema = Schema.Struct({
  ...BackboneElement('CompositionEvent').fields,
  code: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  period: Schema.optional(Schema.suspend(() => Period)),
  detail: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
})
