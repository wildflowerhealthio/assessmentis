import { Schema } from 'effect'
import { DateTimeUtc, DurationFromMillis } from 'effect/Schema'

import { ExternalVideoCallRecordingId } from './video-call-recording'
import { VideoCallRoomName } from './video-call-room'

export const ExternalVideoCallRecordingUri = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRecordingUri')
)

export type ExternalVideoCallRecordingUri = typeof ExternalVideoCallRecordingUri.Type

export const ExternalVideoCallRecordingFileUrl = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRecordingUrl')
)

export type ExternalVideoCallRecordingFileUrl = typeof ExternalVideoCallRecordingFileUrl.Type

export const ExternalVideoCallRecording = Schema.Struct({
  duration: DurationFromMillis,
  externalVideoCallRecordingId: ExternalVideoCallRecordingId,
  recordingFileUrl: Schema.optional(ExternalVideoCallRecordingFileUrl),
  startedAt: DateTimeUtc,
  uri: ExternalVideoCallRecordingUri,
  videoCallRoomName: VideoCallRoomName,
})

export type ExternalVideoCallRecording = typeof ExternalVideoCallRecording.Type
