import { Context, Effect } from 'effect'
import { ExternalVideoCallRoom } from './models/ExternalVideoCallRoom'
import { Zoned } from 'effect/DateTime'
import { ExternalVideoCallRoomName } from './models/VideoCallRoom'
import { Media } from '../diagnostic-medicine/resources/Media'
import { UnhandledError, ExternalAssertionError } from '../errors'

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
    getMediaRecordedInRoom: (
      roomName: ExternalVideoCallRoomName
    ) => Effect.Effect<Media[], UnhandledError | ExternalAssertionError>

    createRoom: (
      params: RoomCreationParams
    ) => Effect.Effect<
      ExternalVideoCallRoom,
      UnhandledError | ExternalAssertionError
    >

    extractRoomNameFromUrl: (
      url: string
    ) => ExternalVideoCallRoomName | undefined
  }
>() {}
