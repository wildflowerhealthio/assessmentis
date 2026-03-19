import { Schema } from 'effect'

import { BackboneElement } from '../../data-types/base/backbone-element'
import type { BackboneElementEncoded } from '../../data-types/base/backbone-element'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Reference } from '../../data-types/complex/identifier-and-reference'
import { Period } from '../../data-types/complex/period'

const fields = {
  code: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  detail: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  period: Schema.optional(Schema.suspend(() => Period)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a composition event entry. */
export interface CompositionEventEncoded
  extends BackboneElementEncoded<'CompositionEvent'>, Schema.Struct.Encoded<typeof fields> {}

/**
 * The clinical service(s) being documented
 */
export const CompositionEventSchema = Schema.Struct({
  ...BackboneElement('CompositionEvent').fields,
  ...fields,
})
