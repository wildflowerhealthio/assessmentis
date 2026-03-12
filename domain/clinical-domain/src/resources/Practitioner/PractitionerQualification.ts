import { Schema } from 'effect'

import {
  BackboneElement,
  CodeableConcept,
  Identifier,
  Period,
  Reference,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
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
