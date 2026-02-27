import { Schema } from 'effect'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Period } from '../../data-types/complex/Period'
import { mutableEncoded } from '@assessmentis/util'

export const EncounterStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('arrived'),
  Schema.Literal('triaged'),
  Schema.Literal('in-progress'),
  Schema.Literal('onleave'),
  Schema.Literal('finished'),
  Schema.Literal('cancelled'),
  Schema.Literal('entered-in-error'),
  Schema.Literal('unknown')
)

export const EncounterStatusHistoryEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('EncounterStatusHistory'),
  mutableEncoded(
    Schema.Struct({
      status: EncounterStatus,
      period: Schema.suspend(() => FhirR4Period.EncodedFromExternal),
    })
  )
)
