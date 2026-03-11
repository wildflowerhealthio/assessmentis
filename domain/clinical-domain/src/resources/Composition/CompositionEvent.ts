import { Schema } from 'effect'

import {
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types/base/BackboneElement'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Reference } from '../../data-types/complex/IdentifierAndReference'
import { Period } from '../../data-types/complex/Period'

const fields = {
  code: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  period: Schema.optional(Schema.suspend(() => Period)),
  detail: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
} as const satisfies Schema.Struct.Fields

export interface CompositionEventEncoded
  extends
    BackboneElementEncoded<'CompositionEvent'>,
    Schema.Struct.Encoded<typeof fields> {}

/**
 * The clinical service(s) being documented
 */
export const CompositionEventSchema = Schema.Struct({
  ...BackboneElement('CompositionEvent').fields,
  ...fields,
})
