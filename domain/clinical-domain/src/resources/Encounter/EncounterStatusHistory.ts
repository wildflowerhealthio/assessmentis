import { Schema } from 'effect'

import {
  BackboneElement,
  Period,
  type BackboneElementEncoded,
} from '../../data-types'

/** FHIR R4 encounter lifecycle status values. */
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

const fields = {
  status: EncounterStatus,
  period: Schema.suspend(() => Period),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of an {@link EncounterStatusHistory}. */
export interface EncounterStatusHistoryEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterStatusHistory'> {}

/** Records a previous status that an {@link Encounter} transitioned through, with the period it was in that status. */
export class EncounterStatusHistory extends BackboneElement(
  'EncounterStatusHistory'
).extend<EncounterStatusHistory>('EncounterStatusHistory')(fields) {}
