import { Schema } from 'effect'

import {
  BackboneElement,
  Coding,
  Period,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  class: Schema.suspend(() => Coding),
  period: Schema.suspend(() => Period),
} as const satisfies Schema.Struct.Fields

export interface EncounterClassHistoryEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'EncounterClassHistory'> {}

export class EncounterClassHistory extends BackboneElement(
  'EncounterClassHistory'
).extend<EncounterClassHistory>('EncounterClassHistory')(fields) {}
