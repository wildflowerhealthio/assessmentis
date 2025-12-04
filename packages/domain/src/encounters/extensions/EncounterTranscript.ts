import { createEncounterExtension } from './createEncounterExtension'

export const encounterTranscriptUrl =
  'http://assessment.is/fhir/encounter-transcript'

const extension = createEncounterExtension(encounterTranscriptUrl, false)

export const EncounterTranscriptExtension = extension.ExtensionSchema
export type EncounterTranscriptExtension =
  typeof EncounterTranscriptExtension.Type

export const getTranscripts = extension.getValues
export const getTranscript = extension.getValue
export const withTranscripts = extension.withValues
export const withTranscript = extension.withValue
