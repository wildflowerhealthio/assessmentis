import { Schema } from 'effect'
import { createExtension } from './createExtension'

export const encounterRecordingFileUrl =
  'http://assessment.is/fhir/encounter-recording-file'

const extension = createExtension(
  encounterRecordingFileUrl,
  'valueUrl',
  Schema.String
)

export const EncounterRecordingFileExtension = extension.ExtensionSchema
export type EncounterRecordingFileExtension =
  typeof EncounterRecordingFileExtension.Type

export const getRecordingFileUrls = extension.getValues
export const withRecordingFileUrls = extension.withValues
