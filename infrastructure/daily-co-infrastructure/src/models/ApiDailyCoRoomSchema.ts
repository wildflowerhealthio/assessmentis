import { VideoCallRoomId } from '@assessmentis/video-call-domain'
import { Schema } from 'effect'

export const ApiDailyCoRoomSchema = Schema.Struct({
  id: VideoCallRoomId,
  name: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
})
