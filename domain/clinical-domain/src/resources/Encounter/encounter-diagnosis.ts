import { Schema } from 'effect'

import { BackboneElement, CodeableConcept, Reference } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

const fields = {
  condition: Schema.suspend(() => Reference),
  rank: Schema.optional(Schema.Int.pipe(Schema.positive())),
  use: Schema.optional(Schema.suspend(() => CodeableConcept)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of an {@link EncounterDiagnosis}. */
export interface EncounterDiagnosisEncoded
  extends Schema.Struct.Encoded<typeof fields>, BackboneElementEncoded<'EncounterDiagnosis'> {}

/** A diagnosis relevant to an {@link Encounter}, with optional use and ranking. */
export class EncounterDiagnosis extends BackboneElement(
  'EncounterDiagnosis'
).extend<EncounterDiagnosis>('EncounterDiagnosis')(fields) {}
