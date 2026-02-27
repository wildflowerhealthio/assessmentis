import { Schema } from 'effect'
import {
  CodeableConcept,
  HumanName,
  ContactPoint,
  Address,
  AdministrativeGender,
  IdentifierAndReference,
  Period,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  relationship: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  name: Schema.optional(Schema.suspend(() => HumanName.HumanName)),
  telecom: Schema.optional(
    Schema.Array(Schema.suspend(() => ContactPoint.ContactPoint))
  ),
  address: Schema.optional(Schema.suspend(() => Address.Address)),
  gender: Schema.optional(AdministrativeGender.AdministrativeGender),
  organization: Schema.optional(
    Schema.suspend(() => IdentifierAndReference.Reference)
  ),
  period: Schema.optional(Schema.suspend(() => Period.Period)),
} as const satisfies Schema.Struct.Fields

export interface PatientContactEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PatientContact'> {}

export class PatientContact extends BackboneElement(
  'PatientContact'
).extend<PatientContact>('PatientContact')(fields) {}
