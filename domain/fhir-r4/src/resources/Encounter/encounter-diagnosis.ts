import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'

export const EncounterDiagnosisEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterDiagnosis'),
  mutableEncoded(
    Schema.Struct({
      condition: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
      rank: Schema.optional(Schema.Number),
      use: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
    })
  )
)
