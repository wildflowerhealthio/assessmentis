import { Schema } from 'effect'
import {
  Coding,
  Period,
  type BackboneElementEncoded,
  BackboneElement,
} from '../../data-types'

const fields = {
  class: Schema.suspend(() => Coding.Coding),
  period: Schema.suspend(() => Period.Period),
} as const satisfies Schema.Struct.Fields

export interface EncounterClassHistoryEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterClassHistory'> {}

export class EncounterClassHistory extends BackboneElement(
  'EncounterClassHistory'
).extend<EncounterClassHistory>('EncounterClassHistory')(fields) {}
