import { Schema } from 'effect'
import { DateTimeUtc, DurationFromMillis } from 'effect/Schema'

import { VideoCallRoomId } from './video-call-room'

export const VideoCallRecordingId = Schema.UUID.pipe(Schema.brand('VideoCallRecordingId'))

export type VideoCallRecordingId = typeof VideoCallRecordingId.Type

export const ExternalVideoCallRecordingId = Schema.UUID.pipe(
  Schema.brand('ExternalVideoCallRecordingId')
)

export type ExternalVideoCallRecordingId = typeof ExternalVideoCallRecordingId.Type

export const VideoCallRecording = Schema.Struct({
  duration: DurationFromMillis,
  externalVideoCallRecordingId: ExternalVideoCallRecordingId,
  startedAt: DateTimeUtc,
  videoCallRecordingId: VideoCallRecordingId,
  videoCallRoomId: VideoCallRoomId,
})

export type VideoCallRecording = typeof VideoCallRecording.Type
