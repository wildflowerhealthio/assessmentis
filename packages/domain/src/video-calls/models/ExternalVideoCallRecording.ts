import { ExternalVideoCallRecordingId } from './VideoCallRecording'
import { ExternalVideoCallRoomName } from './VideoCallRoom'
import { Duration, DateTime } from 'effect'

export interface ExternalVideoCallRecording {
  externalVideoCallRecordingId: ExternalVideoCallRecordingId
  externalVideoCallRoomName: ExternalVideoCallRoomName
  startedAt: DateTime.Utc
  duration: Duration.Duration
}
