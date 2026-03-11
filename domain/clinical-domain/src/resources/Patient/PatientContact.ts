import { Schema } from 'effect'

import {
  Address,
  AdministrativeGender,
  BackboneElement,
  CodeableConcept,
  ContactPoint,
  HumanName,
  Period,
  Reference,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  relationship: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  name: Schema.optional(Schema.suspend(() => HumanName)),
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  address: Schema.optional(Schema.suspend(() => Address)),
  gender: Schema.optional(AdministrativeGender),
  organization: Schema.optional(Schema.suspend(() => Reference)),
  period: Schema.optional(Schema.suspend(() => Period)),
} as const satisfies Schema.Struct.Fields

export interface PatientContactEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PatientContact'> {}

export class PatientContact extends BackboneElement(
  'PatientContact'
).extend<PatientContact>('PatientContact')(fields) {}
