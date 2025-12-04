import { Schema } from 'effect'

export const encounterVideoCallRoomNameUrl =
  'http://assessment.is/fhir/encounter-video-call-room-name'

export const EncounterVideoCallRoomNameExtension = Schema.Struct({
  url: Schema.Literal(encounterVideoCallRoomNameUrl),
  valueString: Schema.String,
})

export type EncounterVideoCallRoomNameExtension =
  typeof EncounterVideoCallRoomNameExtension.Type

export const getVideoCallRoomName = (
  encounter: { extension?: ReadonlyArray<{ url: string; valueString?: string }> }
): string | undefined => {
  const ext = encounter.extension?.find(
    (ext) => ext.url === encounterVideoCallRoomNameUrl
  )
  return ext && 'valueString' in ext ? (ext.valueString as string) : undefined
}

export const withVideoCallRoomName = <T extends { extension?: ReadonlyArray<any> }>(
  encounter: T,
  roomName: string | undefined
): T => {
  const existingExtensions =
    encounter.extension?.filter(
      (ext) => ext.url !== encounterVideoCallRoomNameUrl
    ) ?? []

  return {
    ...encounter,
    extension: [
      ...existingExtensions,
      ...(roomName
        ? [
            {
              url: encounterVideoCallRoomNameUrl,
              valueString: roomName,
            },
          ]
        : []),
    ] as any,
  }
}
