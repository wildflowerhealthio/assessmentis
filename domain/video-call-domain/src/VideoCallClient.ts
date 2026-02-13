import type { DateTime, Effect } from 'effect'
import { Context } from 'effect'
import type { ExternalVideoCallRoom } from './records/ExternalVideoCallRoom'
import type { Zoned } from 'effect/DateTime'
import type { VideoCallRoomName } from './records/VideoCallRoom'
import type {
  MeetingTokenProperties,
  MeetingTokenString,
} from './records/MeetingToken'
import type { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import type {
  AuthError,
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'

export interface RoomCreationParams {
  expiresAt?: Zoned
  enableChat?: boolean
  enableRecording?: boolean
}

export interface MediaWithRoom {
  media: Media
  roomName: VideoCallRoomName
}

export class VideoCallClient extends Context.Tag('VideoCallClient')<
  VideoCallClient,
  {
    getMediaRecordedInRoom: (
      roomName: VideoCallRoomName
    ) => Effect.Effect<
      Media[],
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Recording', { id: string }>
    >

    createRoom: (
      params: RoomCreationParams
    ) => Effect.Effect<
      ExternalVideoCallRoom,
      UnhandledError | ExternalAssertionError | AuthError
    >

    deleteRoom: (
      roomName: VideoCallRoomName
    ) => Effect.Effect<
      void,
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Room', { name: VideoCallRoomName }>
    >

    extractRoomNameFromUrl: (url: string) => VideoCallRoomName | undefined

    listAllRecordings: (
      sinceTimestamp?: DateTime.Utc
    ) => Effect.Effect<
      MediaWithRoom[],
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Recording', { id: string }>
    >

    listAllTranscripts: (
      sinceTimestamp?: DateTime.Utc
    ) => Effect.Effect<
      MediaWithRoom[],
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Transcript', { id: string }>
    >

    getRoom: (
      roomName: VideoCallRoomName
    ) => Effect.Effect<
      ExternalVideoCallRoom,
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Room', { name: VideoCallRoomName }>
    >

    createRoomToken: (options: {
      is_owner?: boolean
      roomName: VideoCallRoomName
    }) => Effect.Effect<
      MeetingTokenString,
      UnhandledError | ExternalAssertionError | AuthError
    >

    parseMeetingToken: (
      token: MeetingTokenString
    ) => Effect.Effect<MeetingTokenProperties, ExternalAssertionError>
  }
>() {}
