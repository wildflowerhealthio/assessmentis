import { Schema } from 'effect'
import { EncounterId } from '../../administration/resources/Encounter'

export const VideoCallRoomId = Schema.UUID.pipe(Schema.brand('VideoCallRoomId'))

export type VideoCallRoomId = typeof VideoCallRoomId.Type

export const ExternalVideoCallRoomId = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRoomId')
)

export type ExternalVideoCallRoomId = typeof ExternalVideoCallRoomId.Type

export const ExternalVideoCallRoomName = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRoomName')
)

export type ExternalVideoCallRoomName = typeof ExternalVideoCallRoomName.Type

export const VideoCallRoom = Schema.Struct({
  encounterId: EncounterId,
  videoCallRoomId: VideoCallRoomId,
  externalVideoCallRoomId: ExternalVideoCallRoomId,
  externalVideoCallRoomName: ExternalVideoCallRoomName,
  url: Schema.String,
})

export type VideoCallRoom = typeof VideoCallRoom.Type
