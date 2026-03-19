import { Schema } from 'effect'

export const ApiDailyCoRoomSchema = Schema.Struct({
  // oxfmt-ignore
  // id: VideoCallRoomId,
  name: Schema.optional(Schema.NonEmptyString),
  url: Schema.optional(Schema.NonEmptyString),
})

export const CompleteApiDailyCoRoom = Schema.Struct({
  // oxfmt-ignore
  // id: VideoCallRoomId,
  name: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
})
