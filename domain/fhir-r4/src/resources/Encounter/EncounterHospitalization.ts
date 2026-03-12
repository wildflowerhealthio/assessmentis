import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'

export const EncounterHospitalizationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterHospitalization'),
  mutableEncoded(
    Schema.Struct({
      preAdmissionIdentifier: Schema.optional(
        Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
      ),
      origin: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      admitSource: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      reAdmission: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      dietPreference: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      specialCourtesy: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      specialArrangement: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      destination: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      dischargeDisposition: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
    })
  )
)
