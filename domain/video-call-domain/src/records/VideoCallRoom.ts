import { Schema } from 'effect'
import { EncounterId } from '@assessmentis/clinical-domain/administration'

export const VideoCallRoomId = Schema.String.pipe(
  Schema.brand('VideoCallRoomId')
)

export type VideoCallRoomId = typeof VideoCallRoomId.Type

export const VideoCallRoomName = Schema.String.pipe(
  Schema.brand('VideoCallRoomName')
)

export type VideoCallRoomName = typeof VideoCallRoomName.Type

export const VideoCallRoom = Schema.Struct({
  encounterId: EncounterId,
  videoCallRoomId: VideoCallRoomId,
  VideoCallRoomName: VideoCallRoomName,
  url: Schema.String,
})

export type VideoCallRoom = typeof VideoCallRoom.Type
