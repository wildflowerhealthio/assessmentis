import { Context, Data, Effect } from 'effect'
import { ExternalVideoCallRoom } from './models/ExternalVideoCallRoom'
import { ExternalVideoCallRecording } from './models/ExternalVideoCallRecording'
import { Zoned } from 'effect/DateTime'
import { ExternalVideoCallRoomName } from './models/VideoCallRoom'

export class ExternalVideoCallServiceError extends Data.TaggedError(
  'ExternalVideoCallServiceError'
)<{
  message: string
  cause: unknown
}> {}

export interface RoomCreationParams {
  expiresAt?: Zoned
  enableChat?: boolean
  enableRecording?: boolean
}

export class ExternalVideoCallClient extends Context.Tag(
  'ExternalVideoCallClient'
)<
  ExternalVideoCallClient,
  {
    fetchRecordingsByRoomName: (
      roomName: ExternalVideoCallRoomName
    ) => Effect.Effect<
      ExternalVideoCallRecording[],
      ExternalVideoCallServiceError
    >
    createRoom: (
      params: RoomCreationParams
    ) => Effect.Effect<ExternalVideoCallRoom, ExternalVideoCallServiceError>

    extractRoomNameFromUrl: (
      url: string
    ) => ExternalVideoCallRoomName | undefined
  }
>() {}
