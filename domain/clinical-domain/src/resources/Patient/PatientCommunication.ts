import { Schema } from 'effect'

import {
  BackboneElement,
  CodeableConcept,
  type BackboneElementEncoded,
} from '../../data-types'

const fields = {
  language: Schema.suspend(() => CodeableConcept),
  preferred: Schema.optional(Schema.Boolean),
} as const satisfies Schema.Struct.Fields

export interface PatientCommunicationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'PatientCommunication'> {}

export class PatientCommunication extends BackboneElement(
  'PatientCommunication'
).extend<PatientCommunication>('PatientCommunication')(fields) {}
