import { createEncounterExtension } from './createEncounterExtension'

export const encounterRecordingUrl =
  'http://assessment.is/fhir/encounter-recording'

const extension = createEncounterExtension(encounterRecordingUrl, true)

export const EncounterRecordingExtension = extension.ExtensionSchema
export type EncounterRecordingExtension = typeof EncounterRecordingExtension.Type

export const getRecordings = extension.getValues
export const getRecording = extension.getValue
export const withRecordings = extension.withValues
export const withRecording = extension.withValue
