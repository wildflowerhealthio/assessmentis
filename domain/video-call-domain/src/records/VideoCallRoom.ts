import { Schema } from 'effect'

export const VideoCallRoomId = Schema.String.pipe(
  Schema.brand('VideoCallRoomId')
)

export type VideoCallRoomId = typeof VideoCallRoomId.Type

export const VideoCallRoomName = Schema.String.pipe(
  Schema.brand('VideoCallRoomName')
)

export type VideoCallRoomName = typeof VideoCallRoomName.Type

// Vestigial — should be removed when VideoCallRoom migrates to use URLs
export const EncounterId = Schema.String.pipe(Schema.brand('EncounterId'))

export type EncounterId = typeof EncounterId.Type

export const VideoCallRoom = Schema.Struct({
  encounterId: EncounterId,
  videoCallRoomId: VideoCallRoomId,
  videoCallRoomName: VideoCallRoomName,
  url: Schema.String,
})

export type VideoCallRoom = typeof VideoCallRoom.Type
