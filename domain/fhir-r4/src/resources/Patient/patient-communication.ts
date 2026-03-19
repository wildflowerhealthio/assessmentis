import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'

export const PatientCommunicationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('PatientCommunication'),
  mutableEncoded(
    Schema.Struct({
      language: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      preferred: Schema.optional(Schema.Boolean),
    })
  )
)
