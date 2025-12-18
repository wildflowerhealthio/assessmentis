import { Context, Effect } from 'effect'
import { ExternalVideoCallRoom } from './models/ExternalVideoCallRoom'
import { Zoned } from 'effect/DateTime'
import { ExternalVideoCallRoomName } from './models/VideoCallRoom'
import { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { UnhandledError, ExternalAssertionError } from '@assessmentis/ontology'

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
