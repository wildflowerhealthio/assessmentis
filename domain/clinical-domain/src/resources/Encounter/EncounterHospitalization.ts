import { Schema } from 'effect'
import {
  CodeableConcept,
  Reference,
  Identifier,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  preAdmissionIdentifier: Schema.optional(Schema.suspend(() => Identifier)),
  origin: Schema.optional(Schema.suspend(() => Reference)),
  admitSource: Schema.optional(Schema.suspend(() => CodeableConcept)),
  reAdmission: Schema.optional(Schema.suspend(() => CodeableConcept)),
  dietPreference: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  specialCourtesy: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  specialArrangement: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  destination: Schema.optional(Schema.suspend(() => Reference)),
  dischargeDisposition: Schema.optional(Schema.suspend(() => CodeableConcept)),
} as const satisfies Schema.Struct.Fields

export interface EncounterHospitalizationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterHospitalization'> {}

export class EncounterHospitalization extends BackboneElement(
  'EncounterHospitalization'
).extend<EncounterHospitalization>('EncounterHospitalization')(fields) {}
