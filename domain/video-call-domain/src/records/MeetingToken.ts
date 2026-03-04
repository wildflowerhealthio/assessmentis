import { Schema } from 'effect'

import { VideoCallRoomName } from './VideoCallRoom'

export const MeetingTokenString = Schema.String.pipe(
  Schema.brand('MeetingTokenString')
)

export type MeetingTokenString = typeof MeetingTokenString.Type

export const MeetingTokenProperties = Schema.Struct({
  roomName: VideoCallRoomName,
  isOwner: Schema.Boolean,
})

export type MeetingTokenProperties = typeof MeetingTokenProperties.Type
