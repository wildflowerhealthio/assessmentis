import { Schema } from 'effect'

export const encounterTranscriptReferenceUrl =
  'http://assessment.is/fhir/encounter-transcript-reference'

export const EncounterTranscriptReferenceExtension = Schema.Struct({
  url: Schema.Literal(encounterTranscriptReferenceUrl),
  valueString: Schema.String,
})

export type EncounterTranscriptReferenceExtension =
  typeof EncounterTranscriptReferenceExtension.Type

export const getTranscriptReference = (
  encounter: { extension?: ReadonlyArray<{ url: string; valueString?: string }> }
): string | undefined => {
  const ext = encounter.extension?.find(
    (ext) => ext.url === encounterTranscriptReferenceUrl
  )
  return ext && 'valueString' in ext ? (ext.valueString as string) : undefined
}

export const withTranscriptReference = <T extends { extension?: ReadonlyArray<any> }>(
  encounter: T,
  transcriptId: string | undefined
): T => {
  const existingExtensions =
    encounter.extension?.filter(
      (ext) => ext.url !== encounterTranscriptReferenceUrl
    ) ?? []

  return {
    ...encounter,
    extension: [
      ...existingExtensions,
      ...(transcriptId
        ? [
            {
              url: encounterTranscriptReferenceUrl,
              valueString: transcriptId,
            },
          ]
        : []),
    ] as any,
  }
}
