import { Schema } from 'effect'

export const VideoCallRoomId = Schema.String.pipe(
  Schema.brand('VideoCallRoomId')
)

export type VideoCallRoomId = typeof VideoCallRoomId.Type

export const VideoCallRoomName = Schema.String.pipe(
  Schema.brand('VideoCallRoomName')
)

export type VideoCallRoomName = typeof VideoCallRoomName.Type

export const VideoCallRoom = Schema.Struct({
  encounterId: Schema.String,
  videoCallRoomId: VideoCallRoomId,
  videoCallRoomName: VideoCallRoomName,
  url: Schema.String,
})

export type VideoCallRoom = typeof VideoCallRoom.Type
