import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'

export const EncounterHospitalizationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterHospitalization'),
  mutableEncoded(
    Schema.Struct({
      admitSource: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      destination: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      dietPreference: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      dischargeDisposition: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      origin: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      preAdmissionIdentifier: Schema.optional(
        Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
      ),
      reAdmission: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      specialArrangement: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      specialCourtesy: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
    })
  )
)
