import { Schema } from 'effect'

import {
  BackboneElement,
  CodeableConcept,
  Period,
  Reference,
  type BackboneElementEncoded,
} from '../../data-types'

export const EncounterLocationStatus = Schema.Union(
  Schema.Literal('planned'),
  Schema.Literal('active'),
  Schema.Literal('reserved'),
  Schema.Literal('completed')
)

const fields = {
  location: Schema.suspend(() => Reference),
  status: Schema.optional(EncounterLocationStatus),
  physicalType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  period: Schema.optional(Schema.suspend(() => Period)),
} as const satisfies Schema.Struct.Fields

export interface EncounterLocationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterLocation'> {}

export class EncounterLocation extends BackboneElement(
  'EncounterLocation'
).extend<EncounterLocation>('EncounterLocation')(fields) {}
