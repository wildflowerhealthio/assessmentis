import { Schema } from 'effect'
import { createExtension } from './createExtension'

export const encounterTranscriptUrl =
  'http://assessment.is/fhir/encounter-transcript'

const extension = createExtension(
  encounterTranscriptUrl,
  'valueUrl',
  Schema.String
)

export const EncounterTranscriptExtension = extension.ExtensionSchema
export type EncounterTranscriptExtension =
  typeof EncounterTranscriptExtension.Type

export const getTranscripts = extension.getValues
export const withTranscripts = extension.withValues
