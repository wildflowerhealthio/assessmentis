import { Context, Effect } from 'effect'
import { ExternalVideoCallRoom } from './models/ExternalVideoCallRoom'
import { Zoned } from 'effect/DateTime'
import { ExternalVideoCallRoomName } from './models/VideoCallRoom'
import { Media } from '../diagnostic-medicine/models/Media'
import { UnhandledError } from '../errors'

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
    ) => Effect.Effect<Media[], UnhandledError>
    createRoom: (
      params: RoomCreationParams
    ) => Effect.Effect<ExternalVideoCallRoom, UnhandledError>

    extractRoomNameFromUrl: (
      url: string
    ) => ExternalVideoCallRoomName | undefined
  }
>() {}
