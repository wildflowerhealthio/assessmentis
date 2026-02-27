import { Schema } from 'effect'
import {
  CodeableConcept,
  IdentifierAndReference,
  Period,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => IdentifierAndReference.Identifier))
  ),
  code: Schema.suspend(() => CodeableConcept),
  period: Schema.optional(Schema.suspend(() => Period.Period)),
  issuer: Schema.optional(
    Schema.suspend(() => IdentifierAndReference.Reference)
  ),
} as const satisfies Schema.Struct.Fields

export interface PractitionerQualificationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PractitionerQualification'> {}

export class PractitionerQualification extends BackboneElement(
  'PractitionerQualification'
).extend<PractitionerQualification>('PractitionerQualification')(fields) {}
