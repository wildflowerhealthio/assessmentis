import { Schema } from 'effect'

import {
  BackboneElement,
  CodeableConcept,
  Period,
  Reference,
} from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

const fields = {
  type: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  period: Schema.optional(Schema.suspend(() => Period)),
  individual: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of an {@link EncounterParticipant}. */
export interface EncounterParticipantEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterParticipant'> {}

/** An individual involved in an {@link Encounter}, with optional type and time period. */
export class EncounterParticipant extends BackboneElement(
  'EncounterParticipant'
).extend<EncounterParticipant>('EncounterParticipant')(fields) {}
