import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary } from '@assessmentis/util'

import {
  BackboneElement,
  CodeableConcept,
  Identifier,
  Period,
  Reference,
} from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

const fields = {
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  code: Schema.suspend(() => CodeableConcept),
  period: Schema.optional(Schema.suspend(() => Period)),
  issuer: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link PractitionerQualification}. */
export interface PractitionerQualificationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PractitionerQualification'> {}

/** A qualification obtained by a {@link Practitioner}, including the issuing organization and validity period. */
export class PractitionerQualification extends BackboneElement(
  'PractitionerQualification'
).extend<PractitionerQualification>('PractitionerQualification')(fields) {}
