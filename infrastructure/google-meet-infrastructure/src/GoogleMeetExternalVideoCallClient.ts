import { Layer, Effect } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
  type RoomCreationParams,
} from '@assessmentis/video-call-domain'
import { UnhandledError } from '@assessmentis/ontology'

export const GoogleMeetExternalVideoCallClientLayer = Layer.effect(
  ExternalVideoCallClient,
  Effect.succeed(
    (function () {
      const getMediaRecordedInRoom: typeof ExternalVideoCallClient.Service.getMediaRecordedInRoom =
        (_roomName: ExternalVideoCallRoomName) =>
          Effect.fail(
            new UnhandledError({
              cause: 'not-implemented',
              message: 'Google Meet recordings not yet implemented',
            })
          )

      const createRoom: typeof ExternalVideoCallClient.Service.createRoom = (
        _: RoomCreationParams
      ) =>
        Effect.gen(function* () {
          const space = yield* Effect.tryPromise(() =>
            gapi.client.meet.spaces.create({
              resource: {
                config: {
                  accessType: 'RESTRICTED',
                  entryPointAccess: 'ALL',
                  artifactConfig: {
                    transcriptionConfig: {
                      autoTranscriptionGeneration: 'ON',
                    },
                  },
                },
              },
            })
          )
          console.log({ space })
          return {
            url: space.result.meetingUri!,
            roomName: ExternalVideoCallRoomName.make(space.result.meetingCode!),
            id: ExternalVideoCallRoomId.make(space.result.name!),
          }
        }).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({
                cause,
                message: 'Error creating the room',
              })
          )
        )

      const extractRoomNameFromUrl: typeof ExternalVideoCallClient.Service.extractRoomNameFromUrl =
        (url: string): ExternalVideoCallRoomName | undefined => {
          const urlParts = url.split('/')
          if (urlParts.length === 0) return undefined

          return ExternalVideoCallRoomName.make(urlParts[urlParts.length - 1])
        }

      return {
        getMediaRecordedInRoom,
        createRoom,
        extractRoomNameFromUrl,
      }
    })()
  )
)
