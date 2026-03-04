import { Schema } from 'effect'
import {
  Period,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

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

export interface EncounterStatusHistoryEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterStatusHistory'> {}

export class EncounterStatusHistory extends BackboneElement(
  'EncounterStatusHistory'
).extend<EncounterStatusHistory>('EncounterStatusHistory')(fields) {}
