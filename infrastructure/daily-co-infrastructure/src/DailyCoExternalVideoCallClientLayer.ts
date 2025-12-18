import { FetchHttpClient, HttpBody, HttpClient } from '@effect/platform'
import { DateTime, Effect, Layer, Schema } from 'effect'
import {
  ExternalVideoCallClient,
  ExternalVideoCallRecordingId,
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
  RoomCreationParams,
  ExternalVideoCallRoom,
} from '@assessmentis/video-call-domain'
import { Media } from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  UnhandledError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import { DailyCoProxyConfig } from '@assessmentis/config-domain/dailyCo'

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

export const DailyCoExternalVideoCallClientLayer = (
  getIdToken: () => Promise<string | undefined>,
  dailyCoConf: DailyCoProxyConfig
) =>
  Layer.effect(
    ExternalVideoCallClient,
    Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient

      const baseDailyApiRoute = dailyCoConf.dailyCoProxyUrl

      const apiDailyCoRoomSchemaParser =
        Schema.decodeUnknown(ApiDailyCoRoomSchema)
      const apiDailyCoRecordingSchemaParser = Schema.decodeUnknown(
        ApiDailyCoRecordingSchema
      )
      const apiDailyCoRecordingLinkSchemaParser = Schema.decodeUnknown(
        ApiDailyCoRecordingLinkSchema
      )
      const idToken = yield* Effect.tryPromise(() => getIdToken()).pipe(
        Effect.mapError(
          (cause) =>
            new UnhandledError({
              cause,
              message: 'Error fetching ID Token for DailyCo API',
            })
        )
      )

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: `Bearer ${idToken}`,
      } as const

      const fetchRecordingFileUrl = (
        recordingId: string
      ): Effect.Effect<
        string | undefined,
        UnhandledError | ExternalAssertionError
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
                new UnhandledError({
                  cause,
                  message: 'HTTP Client Error while fetching recording link',
                })
            )
          )

          if (res.status === 404) {
            // Recording link not available yet
            return undefined
          }

          if (res.status != 200) {
            yield* Effect.fail(
              new UnhandledError({
                cause: `HTTP ${res.status}`,
                message: `DailyCo returned an HTTP status of ${res.status} not 200`,
              })
            )
          }

          const json = yield* res.json.pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  cause,
                  expected: 'Valid JSON response from DailyCo API',
                })
            )
          )

          const linkData = yield* apiDailyCoRecordingLinkSchemaParser(
            json
          ).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  cause,
                  expected: 'Valid recording link schema from DailyCo API',
                })
            )
          )

          return linkData.download_link
        })
      }

      const extractRoomNameFromUrl: typeof ExternalVideoCallClient.Service.extractRoomNameFromUrl =
        (url: string): ExternalVideoCallRoomName | undefined => {
          const urlParts = url.split('/')
          if (urlParts.length === 0) return undefined

          return ExternalVideoCallRoomName.make(urlParts[urlParts.length - 1])
        }

      const getMediaRecordedInRoom: typeof ExternalVideoCallClient.Service.getMediaRecordedInRoom =
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
                  new UnhandledError({
                    cause,
                    message: 'HTTP Client Error while fetching recordings',
                  })
              )
            )

            if (res.status != 200) {
              yield* Effect.fail(
                new UnhandledError({
                  cause: `HTTP ${res.status}`,
                  message: `DailyCo returned an HTTP status of ${res.status} not 200`,
                })
              )
            }

            const json = yield* res.json.pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    cause,
                    expected: 'Valid JSON response from DailyCo recordings API',
                  })
              )
            )

            const apiDailyCoRecordings = yield* apiDailyCoRecordingSchemaParser(
              json
            ).pipe(
              Effect.mapError(
                (cause) =>
                  new ExternalAssertionError({
                    cause,
                    expected: 'Valid recordings schema from DailyCo API',
                  })
              )
            )

            // Fetch recording links for all recordings and create Media objects with fresh URLs
            const mediaWithFreshUrls = yield* Effect.all(
              apiDailyCoRecordings.data.map((rec) =>
                Effect.gen(function* () {
                  const recordingFileUrl = yield* fetchRecordingFileUrl(rec.id)

                  // Skip recordings without a file URL
                  if (!recordingFileUrl) {
                    return undefined
                  }

                  // Convert timestamp to ISO string for DateTimeUtc schema
                  const startedAtUtc = DateTime.unsafeMake(rec.start_ts * 1000)

                  return Media.make({
                    resourceType: 'Media' as const,
                    status: 'completed' as const,
                    identifier: [
                      {
                        value: rec.id,
                      },
                    ],
                    createdDateTime: startedAtUtc,
                    duration: rec.duration, // DailyCo API returns duration in seconds
                    content: {
                      url: recordingFileUrl,
                    },
                  })
                })
              )
            )

            return mediaWithFreshUrls.filter(
              (media): media is Media => media !== undefined
            )
          })
        }
      const createRoom: typeof ExternalVideoCallClient.Service.createRoom = (
        params: RoomCreationParams
      ): Effect.Effect<
        ExternalVideoCallRoom,
        UnhandledError | ExternalAssertionError,
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
                  new UnhandledError({
                    cause,
                    message: 'Error serializing request body JSON',
                  })
              )
            ),
            headers,
          }

          const res = yield* httpClient.post(url, options).pipe(
            Effect.mapError(
              (cause) =>
                new UnhandledError({
                  cause,
                  message: 'HTTP Client Error while creating room',
                })
            )
          )

          if (res.status != 200) {
            const text = yield* res.text.pipe(
              Effect.mapError(
                (cause) =>
                  new UnhandledError({
                    cause,
                    message: 'HTTP body read error',
                  })
              )
            )
            yield* Effect.fail(
              new UnhandledError({
                cause: `HTTP ${res.status}`,
                message: `DailyCo returned an HTTP status of ${res.status} not 200: ${text}`,
              })
            )
          }

          const json = yield* res.json.pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  cause,
                  expected:
                    'Valid JSON response from DailyCo room creation API',
                })
            )
          )

          const apiDailyCoRoom = yield* apiDailyCoRoomSchemaParser(json).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  cause,
                  expected: 'Valid room schema from DailyCo API',
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
        getMediaRecordedInRoom,
        extractRoomNameFromUrl,
      }
    }).pipe(
      Effect.withSpan('DailyCoExternalVideoCallClientLayer'),
      // Provide the HttpClient
      Effect.provide(FetchHttpClient.layer)
    )
  )
