import { Schema } from 'effect'

import { VideoCallRoomName } from './video-call-room'

export const MeetingTokenString = Schema.String.pipe(Schema.brand('MeetingTokenString'))

export type MeetingTokenString = typeof MeetingTokenString.Type

export const MeetingTokenProperties = Schema.Struct({
  isOwner: Schema.Boolean,
  roomName: VideoCallRoomName,
})

export type MeetingTokenProperties = typeof MeetingTokenProperties.Type
