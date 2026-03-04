import { Schema } from 'effect'

import { VideoCallRoomId } from '@assessmentis/video-call-domain'

export const ApiDailyCoRoomSchema = Schema.Struct({
  // id: VideoCallRoomId,
  name: Schema.optional(Schema.NonEmptyString),
  url: Schema.optional(Schema.NonEmptyString),
})

export const CompleteApiDailyCoRoom = Schema.Struct({
  // id: VideoCallRoomId,
  name: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
})
