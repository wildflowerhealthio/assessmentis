import { Layer, Effect } from "effect";
import {
  ExternalVideoCallClient,
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
  ExternalVideoCallServiceError,
  type RoomCreationParams,
} from "@assessmentis/domain/video-calls";

export const GoogleMeetExternalVideoCallClientLayer = Layer.effect(
  ExternalVideoCallClient,
  Effect.succeed(
    (function () {
      const fetchRecordingsByRoomName: typeof ExternalVideoCallClient.Service.fetchRecordingsByRoomName =
        (_: string) =>
          Effect.fail(
            new ExternalVideoCallServiceError({
              message: "not-implemented",
              cause: undefined,
            }),
          );

      const createRoom: typeof ExternalVideoCallClient.Service.createRoom = (
        _: RoomCreationParams,
      ) =>
        Effect.gen(function* () {
          const space = yield* Effect.tryPromise(() =>
            gapi.client.meet.spaces.create({
              resource: {
                config: {
                  accessType: "RESTRICTED",
                  entryPointAccess: "ALL",
                  artifactConfig: {
                    transcriptionConfig: {
                      autoTranscriptionGeneration: "ON",
                    },
                  },
                },
              },
            }),
          );
          console.log({ space });
          return {
            url: space.result.meetingUri!,
            roomName: ExternalVideoCallRoomName.make(space.result.meetingCode!),
            id: ExternalVideoCallRoomId.make(space.result.name!),
          };
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: "Error creating the room",
                cause,
              }),
          ),
        );

      return { fetchRecordingsByRoomName, createRoom };
    })(),
  ),
);
