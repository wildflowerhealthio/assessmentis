import { FetchHttpClient, HttpBody, HttpClient } from '@effect/platform'
import { Config, DateTime, Effect, Layer, Schema } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
  ExternalVideoCallRecordingId,
  ExternalVideoCallRecordingUri,
  ExternalVideoCallRecordingFileUrl,
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
  RoomCreationParams,
  ExternalVideoCallRecording,
  ExternalVideoCallRoom,
} from '@assessmentis/domain/video-calls'

const ApiDailyCoRecordingSchema = Schema.Struct({
  total_count: Schema.Number,
  data: Schema.Array(
    Schema.Struct({
      id: ExternalVideoCallRecordingId,
      room_name: ExternalVideoCallRoomName,
      start_ts: Schema.Number,
      duration: Schema.Number,
    })
  ),
})

const ApiDailyCoRecordingLinkSchema = Schema.Struct({
  download_link: Schema.String,
})

const ApiDailyCoRoomSchema = Schema.Struct({
  id: ExternalVideoCallRoomId,
  name: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
})

export const DailyCoExternalVideoCallClientLayer = Layer.effect(
  ExternalVideoCallClient,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient

    const baseDailyApiRoute =
      window.location.origin +
      (yield* Config.string('PUBLIC_BASE_DAILY_API_ROUTE'))

    const apiDailyCoRoomSchemaParser =
      Schema.decodeUnknown(ApiDailyCoRoomSchema)
    const apiDailyCoRecordingSchemaParser = Schema.decodeUnknown(
      ApiDailyCoRecordingSchema
    )
    const apiDailyCoRecordingLinkSchemaParser = Schema.decodeUnknown(
      ApiDailyCoRecordingLinkSchema
    )

    const headers = {
      'Content-Type': 'application/json',
    } as const

    const fetchRecordingFileUrl = (
      recordingId: string
    ): Effect.Effect<
      ExternalVideoCallRecordingFileUrl | undefined,
      ExternalVideoCallServiceError
    > => {
      return Effect.gen(function* () {
        const url = new URL(
          `${baseDailyApiRoute}/recordings/${recordingId}/access-link`
        )
        const options = {
          method: 'GET',
          headers,
        }
        const res = yield* httpClient.get(url, options).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: 'HTTP Client Error while fetching recording link',
                cause,
              })
          )
        )

        if (res.status === 404) {
          // Recording link not available yet
          return undefined
        }

        if (res.status != 200) {
          yield* Effect.fail(
            new ExternalVideoCallServiceError({
              message: `DailyCo returned an HTTP status of ${res.status} not 200`,
              cause: undefined,
            })
          )
        }

        const json = yield* res.json.pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: 'Error parsing JSON in response',
                cause,
              })
          )
        )

        const linkData = yield* apiDailyCoRecordingLinkSchemaParser(json).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: 'Error validating JSON Response',
                cause,
              })
          )
        )

        return ExternalVideoCallRecordingFileUrl.make(linkData.download_link)
      })
    }

    const extractRoomNameFromUrl: typeof ExternalVideoCallClient.Service.extractRoomNameFromUrl =
      (url: string): ExternalVideoCallRoomName | undefined => {
        const urlParts = url.split('/')
        if (urlParts.length === 0) return undefined

        return ExternalVideoCallRoomName.make(urlParts[urlParts.length - 1])
      }

    const fetchRecordingsByRoomName: typeof ExternalVideoCallClient.Service.fetchRecordingsByRoomName =
      (roomName: ExternalVideoCallRoomName) => {
        return Effect.gen(function* () {
          const url = new URL(`${baseDailyApiRoute}/recordings`)
          url.searchParams.set('room_name', roomName)
          const options = {
            method: 'GET',
            headers,
          }
          const res = yield* httpClient.get(url, options).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: 'HTTP Client Error while fetching recordings',
                  cause,
                })
            )
          )

          if (res.status != 200) {
            yield* Effect.fail(
              new ExternalVideoCallServiceError({
                message: `DailyCo returned an HTTP status of ${res.status} not 200`,
                cause: undefined,
              })
            )
          }

          const json = yield* res.json.pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: 'Error parsing JSON in response',
                  cause,
                })
            )
          )

          const apiDailyCoRecordings = yield* apiDailyCoRecordingSchemaParser(
            json
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: 'Error validating JSON Response',
                  cause,
                })
            )
          )

          // Fetch recording links for all recordings and decode
          const recordingsWithLinks = yield* Effect.all(
            apiDailyCoRecordings.data.map((rec) =>
              Effect.gen(function* () {
                const recordingFileUrl = yield* fetchRecordingFileUrl(rec.id)

                // Convert timestamp to ISO string for DateTimeUtc schema
                const startedAtUtc = DateTime.unsafeMake(rec.start_ts * 1000)
                const startedAtIso = DateTime.formatIso(startedAtUtc)

                const recordingData = {
                  externalVideoCallRecordingId: rec.id,
                  externalVideoCallRoomName: roomName,
                  startedAt: startedAtIso,
                  duration: rec.duration * 1000, // convert to milliseconds
                  uri: ExternalVideoCallRecordingUri.make(
                    `https://api.daily.co/v1/recordings/${rec.id}`
                  ),
                  recordingFileUrl,
                }

                // Decode using the schema to ensure type safety
                return yield* Schema.decode(ExternalVideoCallRecording)(
                  recordingData
                ).pipe(
                  Effect.mapError(
                    (cause) =>
                      new ExternalVideoCallServiceError({
                        message: 'Error decoding recording data',
                        cause,
                      })
                  )
                )
              })
            )
          )

          return recordingsWithLinks
        })
      }
    const createRoom: typeof ExternalVideoCallClient.Service.createRoom = (
      params: RoomCreationParams
    ): Effect.Effect<
      ExternalVideoCallRoom,
      ExternalVideoCallServiceError,
      never
    > =>
      Effect.gen(function* () {
        const expiryInstant = params.expiresAt
          ? params.expiresAt
          : (yield* DateTime.now).pipe(DateTime.addDuration('30 minutes'))
        const exp = Math.floor(expiryInstant.epochMillis / 1000)

        const url = new URL(`${baseDailyApiRoute}/rooms`)

        const body = {
          properties: {
            exp,
            enable_chat: params.enableChat ?? false,
            enable_recording: params.enableRecording ? 'cloud' : undefined,
          },
        }

        const options = {
          method: 'POST',
          body: yield* HttpBody.json(body).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: 'Error serializing request body JSON',
                  cause,
                })
            )
          ),
          headers,
        }

        const res = yield* httpClient.post(url, options).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: 'HTTP Client Error while creating room',
                cause,
              })
          )
        )

        if (res.status != 200) {
          const text = yield* res.text.pipe(
            Effect.mapError(
              (cause) =>
                new ExternalVideoCallServiceError({
                  message: 'HTTP body read error',
                  cause,
                })
            )
          )
          yield* Effect.fail(
            new ExternalVideoCallServiceError({
              message: `DailyCo returned an HTTP status of ${res.status} not 200: ${text}`,
              cause: undefined,
            })
          )
        }

        const json = yield* res.json.pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: 'Error parsing JSON in response',
                cause,
              })
          )
        )

        const apiDailyCoRoom = yield* apiDailyCoRoomSchemaParser(json).pipe(
          Effect.mapError(
            (cause) =>
              new ExternalVideoCallServiceError({
                message: 'Error validating JSON Response',
                cause,
              })
          )
        )

        return {
          id: ExternalVideoCallRoomId.make(apiDailyCoRoom.id),
          roomName: ExternalVideoCallRoomName.make(apiDailyCoRoom.name),
          url: apiDailyCoRoom.url,
        }
      })
    return {
      createRoom,
      fetchRecordingsByRoomName,
      extractRoomNameFromUrl,
    }
  }).pipe(
    Effect.withSpan('DailyCoExternalVideoCallClientLayer'),
    // Provide the HttpClient
    Effect.provide(FetchHttpClient.layer)
  )
)
