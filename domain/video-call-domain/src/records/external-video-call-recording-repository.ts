import type { Effect } from 'effect'
import type { UnknownException } from 'effect/Cause'

import type { ExternalVideoCallRecording } from './external-video-call-recording'
import type { VideoCallRoomName } from './video-call-room'

export abstract class ExternalVideoCallRecordingRepository {
  abstract fetchRecordingsByRoomName(
    roomName: VideoCallRoomName
  ): Effect.Effect<ExternalVideoCallRecording[], UnknownException>
}
