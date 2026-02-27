import { Schema } from 'effect'
import {
  CodeableConcept,
  Period,
  IdentifierAndReference,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

export const EncounterLocationStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('active'),
  Schema.Literal('reserved'),
  Schema.Literal('completed')
)

const fields = {
  location: Schema.suspend(() => IdentifierAndReference.Reference),
  status: Schema.optional(EncounterLocationStatus),
  physicalType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  period: Schema.optional(Schema.suspend(() => Period.Period)),
} as const satisfies Schema.Struct.Fields

export interface EncounterLocationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterLocation'> {}

export class EncounterLocation extends BackboneElement(
  'EncounterLocation'
).extend<EncounterLocation>('EncounterLocation')(fields) {}
