import { Schema } from 'effect'
import { ExternalVideoCallRecordingId } from './VideoCallRecording'
import { VideoCallRoomName } from './VideoCallRoom'
import { DateTimeUtc, DurationFromMillis } from 'effect/Schema'

export const ExternalVideoCallRecordingUri = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRecordingUri')
)

export type ExternalVideoCallRecordingUri =
  typeof ExternalVideoCallRecordingUri.Type

export const ExternalVideoCallRecordingFileUrl = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRecordingUrl')
)

export type ExternalVideoCallRecordingFileUrl =
  typeof ExternalVideoCallRecordingFileUrl.Type

export const ExternalVideoCallRecording = Schema.Struct({
  externalVideoCallRecordingId: ExternalVideoCallRecordingId,
  videoCallRoomName: VideoCallRoomName,
  startedAt: DateTimeUtc,
  duration: DurationFromMillis,
  uri: ExternalVideoCallRecordingUri,
  recordingFileUrl: Schema.optional(ExternalVideoCallRecordingFileUrl),
})

export type ExternalVideoCallRecording = typeof ExternalVideoCallRecording.Type
