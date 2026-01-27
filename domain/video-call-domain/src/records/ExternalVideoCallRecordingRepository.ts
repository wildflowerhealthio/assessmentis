import { Effect } from 'effect'
import { UnknownException } from 'effect/Cause'
import { ExternalVideoCallRecording } from './ExternalVideoCallRecording'
import { VideoCallRoomName } from './VideoCallRoom'

export abstract class ExternalVideoCallRecordingRepository {
  abstract fetchRecordingsByRoomName(
    roomName: VideoCallRoomName
  ): Effect.Effect<ExternalVideoCallRecording[], UnknownException>
}
