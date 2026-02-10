import {
  ExternalVideoCallRecordingId,
  VideoCallRoomName,
} from '@assessmentis/video-call-domain'
import { Schema } from 'effect'

export const ApiDailyCoRecordingSchema = Schema.Struct({
  total_count: Schema.Number,
  data: Schema.Array(
    Schema.Struct({
      id: ExternalVideoCallRecordingId,
      room_name: VideoCallRoomName,
      start_ts: Schema.Number,
      duration: Schema.Number,
    })
  ),
})
