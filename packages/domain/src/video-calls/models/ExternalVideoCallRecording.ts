import { Schema } from 'effect'
import { ExternalVideoCallRecordingId } from './VideoCallRecording'
import { ExternalVideoCallRoomName } from './VideoCallRoom'
import { DateTimeUtc, DurationFromMillis } from 'effect/Schema'

export const ExternalVideoCallRecordingUri = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRecordingUri')
)

export type ExternalVideoCallRecordingUri =
  typeof ExternalVideoCallRecordingUri.Type

export const ExternalVideoCallRecordingUrl = Schema.String.pipe(
  Schema.brand('ExternalVideoCallRecordingUrl')
)

export type ExternalVideoCallRecordingUrl =
  typeof ExternalVideoCallRecordingUrl.Type

export const ExternalVideoCallRecording = Schema.Struct({
  externalVideoCallRecordingId: ExternalVideoCallRecordingId,
  externalVideoCallRoomName: ExternalVideoCallRoomName,
  startedAt: DateTimeUtc,
  duration: DurationFromMillis,
  uri: ExternalVideoCallRecordingUri,
  recordingUrl: Schema.optional(ExternalVideoCallRecordingUrl),
})

export type ExternalVideoCallRecording =
  typeof ExternalVideoCallRecording.Type
