import { Schema } from 'effect'

import {
  BackboneElement,
  CodeableConcept,
  Period,
  Reference,
  type BackboneElementEncoded,
} from '../../data-types'

/** Status of a location during an encounter — planned, active, reserved, or completed. */
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

/** Encoded (wire-format) shape of an {@link EncounterLocation}. */
export interface EncounterLocationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterLocation'> {}

/** A location where an {@link Encounter} takes place, with status and time period. */
export class EncounterLocation extends BackboneElement(
  'EncounterLocation'
).extend<EncounterLocation>('EncounterLocation')(fields) {}
