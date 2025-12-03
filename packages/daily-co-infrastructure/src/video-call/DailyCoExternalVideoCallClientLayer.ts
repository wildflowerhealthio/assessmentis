import { FetchHttpClient, HttpBody, HttpClient } from "@effect/platform";
import { Config, DateTime, Duration, Effect, Layer, Schema, Option } from "effect";
import {
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
  ExternalVideoCallRecordingId,
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
} from "assessmentis-domain";
import type {
    RoomCreationParams,
  ExternalVideoCallRecording,
  ExternalVideoCallRoom,
} from "assessmentis-domain";

const ApiDailyCoRecordingSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  externalVideoCallRoomName: Schema.NonEmptyString,
  start_ts: Schema.Number,
  duration: Schema.Number,
});

const ApiDailyCoRoomSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
});

export const DailyCoExternalVideoCallClientLayer = Layer.effect(
  ExternalVideoCallClient,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;

    const baseDailyApiRoute = yield* Config.string(
      "PUBLIC_BASE_DAILY_API_ROUTE",
    );

    const apiDailyCoRoomSchemaParser =
      Schema.decodeUnknown(ApiDailyCoRoomSchema);
    const apiDailyCoRecordingSchemaParser = Schema.decodeUnknown(
      Schema.Array(ApiDailyCoRecordingSchema),
    );

    const headers = {
      "Content-Type": "application/json",
    } as const;

    return {
      fetchRecordingsByRoomName(roomName: string) {
        return Effect.gen(function* () {
          const url = new URL(`${baseDailyApiRoute}/recordings`);
          url.searchParams.set("room_name", roomName);
          const options = {
            method: "GET",
            headers,
          };
          const res = yield* httpClient.get(url, options).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: "HTTP Client Error while fetching recordings",
                  cause,
                }),
            ),
          );

          if (res.status != 200) {
            yield* Effect.fail(
              new ExternalVideoCallServiceError({
                message: `DailyCo returned an HTTP status of ${res.status} not 200`,
                cause: undefined,
              }),
            );
          }

          const json = yield* res.json.pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: "Error parsing JSON in response",
                  cause,
                }),
            ),
          );

          const apiDailyCoRooms = yield* apiDailyCoRecordingSchemaParser(
            json,
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: "Error validating JSON Response",
                  cause,
                }),
            ),
          );

          return apiDailyCoRooms.map(
            (rec): ExternalVideoCallRecording => ({
              externalVideoCallRecordingId:
                rec.id as ExternalVideoCallRecordingId,
              externalVideoCallRoomName: roomName as ExternalVideoCallRoomName,
              startedAt: DateTime.make(rec.start_ts * 1000).pipe(Option.getOrThrow),
              duration: Duration.seconds(rec.duration),
            }),
          );
        });
      },
      createRoom(
        params: RoomCreationParams,
      ): Effect.Effect<ExternalVideoCallRoom, ExternalVideoCallServiceError> {
        return Effect.gen(function* () {
          const expiryInstant = params.expiresAt
            ? params.expiresAt
            : (yield* DateTime.now).pipe(DateTime.addDuration("30 minutes"));
          const exp = Math.floor(expiryInstant.epochMillis / 1000);

          const url = new URL(`${baseDailyApiRoute}/rooms`);

          const body = {
            properties: {
              exp,
              enable_chat: params.enableChat ?? false,
              enable_recording: params.enableRecoding ? "cloud" : undefined,
            },
          };

          const options = {
            method: "POST",
            body: yield* HttpBody.json(body).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalVideoCallServiceError({
                    message: "Error serializing request body JSON",
                    cause,
                  }),
              ),
            ),
            headers,
          };

          const res = yield* httpClient.post(url, options).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: "HTTP Client Error while creating room",
                  cause,
                }),
            ),
          );

          if (res.status != 200) {
            const text = yield* res.text.pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalVideoCallServiceError({
                    message: "HTTP body read error",
                    cause,
                  }),
              ),
            );
            yield* Effect.fail(
              new ExternalVideoCallServiceError({
                message: `DailyCo returned an HTTP status of ${res.status} not 200: ${text}`,
                cause: undefined,
              }),
            );
          }

          const json = yield* res.json.pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: "Error parsing JSON in response",
                  cause,
                }),
            ),
          );

          const apiDailyCoRoom = yield* apiDailyCoRoomSchemaParser(json).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: "Error validating JSON Response",
                  cause,
                }),
            ),
          );

          return {
            id: ExternalVideoCallRoomId.make(apiDailyCoRoom.id),
            roomName: ExternalVideoCallRoomName.make(apiDailyCoRoom.name),
            url: apiDailyCoRoom.url,
          };
        });
      },
    };
  }).pipe(
    Effect.withSpan("DailyCoExternalVideoCallClientLayer"),
    // Provide the HttpClient
    Effect.provide(FetchHttpClient.layer),
  ),
);
