import { Schema } from 'effect'
import { createExtension } from './createExtension'

export const encounterRecordingUrl =
  'http://assessment.is/fhir/encounter-recording'

const extension = createExtension(
  encounterRecordingUrl,
  'valueUrl',
  Schema.String
)

export const EncounterRecordingExtension = extension.ExtensionSchema
export type EncounterRecordingExtension = typeof EncounterRecordingExtension.Type

export const getRecordings = extension.getValues
export const withRecordings = extension.withValues
