import { Context, Effect } from 'effect'
import { ExternalVideoCallRoom } from './records/ExternalVideoCallRoom'
import { Zoned } from 'effect/DateTime'
import { ExternalVideoCallRoomName } from './records/VideoCallRoom'
import { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { UnhandledError, ExternalAssertionError } from '@assessmentis/ontology'
import { AuthError } from '@assessmentis/platform-domain'

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
    ) => Effect.Effect<
      Media[],
      UnhandledError | ExternalAssertionError | AuthError
    >

    createRoom: (
      params: RoomCreationParams
    ) => Effect.Effect<
      ExternalVideoCallRoom,
      UnhandledError | ExternalAssertionError | AuthError
    >

    extractRoomNameFromUrl: (
      url: string
    ) => ExternalVideoCallRoomName | undefined
  }
>() {}
