import { Schema } from 'effect'

export const encounterRecordingReferenceUrl =
  'http://assessment.is/fhir/encounter-recording-reference'

export const EncounterRecordingReferenceExtension = Schema.Struct({
  url: Schema.Literal(encounterRecordingReferenceUrl),
  valueString: Schema.String,
})

export type EncounterRecordingReferenceExtension =
  typeof EncounterRecordingReferenceExtension.Type

export const getRecordingReference = (
  encounter: { extension?: ReadonlyArray<{ url: string; valueString?: string }> }
): string | undefined => {
  const ext = encounter.extension?.find(
    (ext) => ext.url === encounterRecordingReferenceUrl
  )
  return ext && 'valueString' in ext ? (ext.valueString as string) : undefined
}

export const withRecordingReference = <T extends { extension?: ReadonlyArray<any> }>(
  encounter: T,
  recordingId: string | undefined
): T => {
  const existingExtensions =
    encounter.extension?.filter(
      (ext) => ext.url !== encounterRecordingReferenceUrl
    ) ?? []

  return {
    ...encounter,
    extension: [
      ...existingExtensions,
      ...(recordingId
        ? [
            {
              url: encounterRecordingReferenceUrl,
              valueString: recordingId,
            },
          ]
        : []),
    ] as any,
  }
}
