import { Schema } from "effect";
import { VideoCallRoomId } from "./VideoCallRoom";
import { DateTimeUtc, DurationFromMillis } from "effect/Schema";

export const VideoCallRecordingId = Schema.UUID.pipe(
  Schema.brand("VideoCallRecordingId"),
);

export type VideoCallRecordingId = typeof VideoCallRecordingId.Type;

export const ExternalVideoCallRecordingId = Schema.UUID.pipe(
  Schema.brand("ExternalVideoCallRecordingId"),
);

export type ExternalVideoCallRecordingId =
  typeof ExternalVideoCallRecordingId.Type;

export const VideoCallRecording = Schema.Struct({
  videoCallRecordingId: VideoCallRecordingId,
  externalVideoCallRecordingId: ExternalVideoCallRecordingId,
  videoCallRoomId: VideoCallRoomId,
  startedAt: DateTimeUtc,
  duration: DurationFromMillis,
});

export type VideoCallRecording = typeof VideoCallRecording.Type;
