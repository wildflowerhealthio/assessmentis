import { Layer, Effect, DateTime } from 'effect'
import {
  VideoCallClient,
  VideoCallRoomId,
  VideoCallRoomName,
  type RoomCreationParams,
} from '@assessmentis/video-call-domain'
import { UnhandledError } from '@assessmentis/ontology'

export const GoogleMeetVideoCallClientLayer = Layer.effect(
  VideoCallClient,
  Effect.succeed(
    (function () {
      const getMediaRecordedInRoom: typeof VideoCallClient.Service.getMediaRecordedInRoom =
        (_roomName: VideoCallRoomName) =>
          Effect.fail(
            new UnhandledError({
              cause: 'not-implemented',
              message: 'Google Meet recordings not yet implemented',
            })
          )

      const createRoom: typeof VideoCallClient.Service.createRoom = (
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
            roomName: VideoCallRoomName.make(space.result.meetingCode!),
            id: VideoCallRoomId.make(space.result.name!),
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

      const deleteRoom: typeof VideoCallClient.Service.deleteRoom = (
        _roomName: VideoCallRoomName
      ) =>
        Effect.fail(
          new UnhandledError({
            cause: 'not-implemented',
            message: 'Google Meet room deletion not yet implemented',
          })
        )

      const extractRoomNameFromUrl: typeof VideoCallClient.Service.extractRoomNameFromUrl =
        (url: string): VideoCallRoomName | undefined => {
          const urlParts = url.split('/')
          if (urlParts.length <= 1) return undefined

          return VideoCallRoomName.make(urlParts[urlParts.length - 1])
        }

      const listAllRecordings: typeof VideoCallClient.Service.listAllRecordings =
        (_sinceTimestamp?: DateTime.Utc) =>
          Effect.fail(
            new UnhandledError({
              cause: 'not-implemented',
              message: 'Google Meet recording listing not yet implemented',
            })
          )

      const listAllTranscripts: typeof VideoCallClient.Service.listAllTranscripts =
        (_sinceTimestamp?: DateTime.Utc) =>
          Effect.fail(
            new UnhandledError({
              cause: 'not-implemented',
              message: 'Google Meet transcript listing not yet implemented',
            })
          )

      const getRoom: typeof VideoCallClient.Service.getRoom = (
        _roomName: VideoCallRoomName
      ) =>
        Effect.fail(
          new UnhandledError({
            cause: 'not-implemented',
            message: 'Google Meet room lookup not yet implemented',
          })
        )

      return {
        getMediaRecordedInRoom,
        createRoom,
        extractRoomNameFromUrl,
        listAllRecordings,
        listAllTranscripts,
        getRoom,
        deleteRoom,
      }
    })()
  )
)
