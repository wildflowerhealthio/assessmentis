import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'

export const EncounterDiagnosisEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterDiagnosis'),
  mutableEncoded(
    Schema.Struct({
      condition: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
      use: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      rank: Schema.optional(Schema.Number),
    })
  )
)
