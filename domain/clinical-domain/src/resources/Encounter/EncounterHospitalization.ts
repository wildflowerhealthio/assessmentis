import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary } from '@assessmentis/util'

import {
  BackboneElement,
  CodeableConcept,
  Identifier,
  Reference,
} from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

const fields = {
  preAdmissionIdentifier: Schema.optional(Schema.suspend(() => Identifier)),
  origin: Schema.optional(Schema.suspend(() => Reference)),
  admitSource: Schema.optional(Schema.suspend(() => CodeableConcept)),
  reAdmission: Schema.optional(Schema.suspend(() => CodeableConcept)),
  dietPreference: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  specialCourtesy: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  specialArrangement: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  destination: Schema.optional(Schema.suspend(() => Reference)),
  dischargeDisposition: Schema.optional(Schema.suspend(() => CodeableConcept)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of an {@link EncounterHospitalization}. */
export interface EncounterHospitalizationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterHospitalization'> {}

/** Admission and discharge details for an {@link Encounter}. */
export class EncounterHospitalization extends BackboneElement(
  'EncounterHospitalization'
).extend<EncounterHospitalization>('EncounterHospitalization')(fields) {}
