import { Schema } from 'effect'
import {
  CodeableConcept,
  Period,
  Reference,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  type: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  period: Schema.optional(Schema.suspend(() => Period)),
  individual: Schema.optional(
    Schema.suspend(() => Reference)
  ),
} as const satisfies Schema.Struct.Fields

export interface EncounterParticipantEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterParticipant'> {}

export class EncounterParticipant extends BackboneElement(
  'EncounterParticipant'
).extend<EncounterParticipant>('EncounterParticipant')(fields) {}
