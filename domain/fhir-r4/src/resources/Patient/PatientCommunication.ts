import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { mutableEncoded } from '@assessmentis/util'

export const PatientCommunicationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientCommunication'),
  mutableEncoded(
    Schema.Struct({
      language: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      preferred: Schema.optional(Schema.Boolean),
    })
  )
)
