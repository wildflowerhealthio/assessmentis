import { Schema } from 'effect'

import { BackboneElement, Coding, Period } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

const fields = {
  class: Schema.suspend(() => Coding),
  period: Schema.suspend(() => Period),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of an {@link EncounterClassHistory}. */
export interface EncounterClassHistoryEncoded
  extends Schema.Struct.Encoded<typeof fields>, BackboneElementEncoded<'EncounterClassHistory'> {}

/** Records a previous class (e.g. inpatient, outpatient) that an {@link Encounter} transitioned through. */
export class EncounterClassHistory extends BackboneElement(
  'EncounterClassHistory'
).extend<EncounterClassHistory>('EncounterClassHistory')(fields) {}
