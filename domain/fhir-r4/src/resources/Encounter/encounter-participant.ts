import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'
import { FhirR4Period } from '../../data-types/complex/period'

export const EncounterParticipantEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterParticipant'),
  mutableEncoded(
    Schema.Struct({
      individual: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      type: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
    })
  )
)
