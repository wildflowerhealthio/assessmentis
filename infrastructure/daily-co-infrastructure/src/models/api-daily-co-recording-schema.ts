import { Schema } from 'effect'

import { ExternalVideoCallRecordingId, VideoCallRoomName } from '@assessmentis/video-call-domain'

export const ApiDailyCoRecordingSchema = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: ExternalVideoCallRecordingId,
      room_name: VideoCallRoomName,
      start_ts: Schema.Int,
      duration: Schema.Number,
    })
  ),
  total_count: Schema.Number,
})
