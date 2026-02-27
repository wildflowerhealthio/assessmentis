import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Period } from '../../data-types/complex/Period'
import { mutableEncoded } from '@assessmentis/util'

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
      status: Schema.optional(EncounterLocationStatus),
      physicalType: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
    })
  )
)
