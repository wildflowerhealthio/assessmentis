import { Effect } from "effect";
import { UnknownException } from "effect/Cause";
import { ExternalVideoCallRecording } from "./ExternalVideoCallRecording";
import { ExternalVideoCallRoomName } from "./VideoCallRoom";

export abstract class ExternalVideoCallRecordingRepository {
  abstract fetchRecordingsByRoomName(
    roomName: ExternalVideoCallRoomName,
  ): Effect.Effect<ExternalVideoCallRecording[], UnknownException>;
}
