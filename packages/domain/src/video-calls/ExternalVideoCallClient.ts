import { Context, Data, Effect } from "effect";
import { ExternalVideoCallRoom } from "./models/ExternalVideoCallRoom";
import { ExternalVideoCallRecording } from "./models/ExternalVideoCallRecording";
import { Zoned } from "effect/DateTime";

export class ExternalVideoCallServiceError extends Data.TaggedError(
  "ExternalVideoCallServiceError",
)<{
  message: string;
  cause: unknown;
}> {}

export interface RoomCreationParams {
  expiresAt?: Zoned;
  enableChat?: boolean;
  enableRecoding?: boolean;
}

export class ExternalVideoCallClient extends Context.Tag(
  "ExternalVideoCallClient",
)<
  ExternalVideoCallClient,
  {
    fetchRecordingsByRoomName: (
      roomName: string,
    ) => Effect.Effect<
      ExternalVideoCallRecording[],
      ExternalVideoCallServiceError
    >;
    createRoom: (
      params: RoomCreationParams,
    ) => Effect.Effect<ExternalVideoCallRoom, ExternalVideoCallServiceError>;
  }
>() {}
