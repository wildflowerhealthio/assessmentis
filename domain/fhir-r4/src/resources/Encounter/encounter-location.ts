import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'
import { FhirR4Period } from '../../data-types/complex/period'

export const EncounterLocationStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('active'),
  Schema.Literal('reserved'),
  Schema.Literal('completed')
)

export const EncounterLocationEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterLocation'),
  mutableEncoded(
    Schema.Struct({
      location: Schema.suspend(() => FhirR4Reference.EncodedFromExternal),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      physicalType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      status: Schema.optional(EncounterLocationStatus),
    })
  )
)
