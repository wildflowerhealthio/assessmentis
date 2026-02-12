import type { Effect } from 'effect'
import type { UnknownException } from 'effect/Cause'
import type { ExternalVideoCallRecording } from './ExternalVideoCallRecording'
import type { VideoCallRoomName } from './VideoCallRoom'

export abstract class ExternalVideoCallRecordingRepository {
  abstract fetchRecordingsByRoomName(
    roomName: VideoCallRoomName
  ): Effect.Effect<ExternalVideoCallRecording[], UnknownException>
}
