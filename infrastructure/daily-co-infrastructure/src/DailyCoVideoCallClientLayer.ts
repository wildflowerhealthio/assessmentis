import { HttpClient } from '@effect/platform/HttpClient'
import { DateTime, Effect, Layer, pipe, Schema } from 'effect'
import type { ExternalVideoCallRoom } from '@assessmentis/video-call-domain'
import {
  VideoCallRoomId,
  VideoCallRoomName,
  MeetingTokenString,
} from '@assessmentis/video-call-domain'
import { Media } from '@assessmentis/clinical-domain'
import {
  Attachment,
  Code,
  CodeableConcept,
  Coding,
  IdentifierAndReference,
} from '@assessmentis/clinical-domain/data-types'
import type {
  AuthError,
  UnhandledError,
  NotFoundError,
} from '@assessmentis/ontology'
import { ExternalAssertionError } from '@assessmentis/ontology'
import { DailyCoContext } from '@assessmentis/config-domain'
import { ApiDailyCoRecordingSchema } from './models/ApiDailyCoRecordingSchema'
import { ApiDailyCoTranscriptSchema } from './models/ApiDailyCoTranscriptSchema'
import { ApiDailyCoTranscriptLinkSchema } from './models/ApiDailyCoTranscriptLinkSchema'
import { ApiDailyCoRecordingLinkSchema } from './models/ApiDailyCoRecordingLinkSchema'
import { ApiDailyCoRoomSchema } from './models/ApiDailyCoRoomSchema'
import { ApiDailyCoMeetingTokenSchema } from './models/ApiDailyCoMeetingTokenSchema'
import { DailyCoMeetingTokenPayloadSchema } from './models/DailyCoMeetingTokenPayloadSchema'
import type {
  MediaWithRoom,
  RoomCreationParams,
} from '../../../domain/video-call-domain/src/VideoCallClient'
import { VideoCallClient } from '../../../domain/video-call-domain/src/VideoCallClient'
import {
  getRequestFromHeaders,
  postRequestFromHeaders,
  deleteRequestFromHeaders,
  handleHttpClientError,
  handle404,
  assertStatus,
  parseAs,
} from './httpHelpers'

/**
 * Shared implementation of the Daily.co VideoCallClient.
 * Parameterized by base URL, headers, and config to support both
 * proxy mode (frontend) and direct API mode (backend).
 */
export const DailyCoVideoCallClientLayer: Layer.Layer<
  VideoCallClient,
  never,
  HttpClient | DailyCoContext
> = Layer.effect(
  VideoCallClient,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient
    const { config: dailyCoConf, authHeadersEffect: headersEffect } =
      yield* DailyCoContext
    const baseUrl =
      typeof window === 'undefined'
        ? 'https://api.daily.co/v1'
        : dailyCoConf.dailyCoProxyUrl

    const fetchRecordingFileUrl = (
      recordingId: string
    ): Effect.Effect<
      string | undefined,
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Recording', { id: string }>
    > =>
      pipe(
        headersEffect,
        getRequestFromHeaders(
          httpClient,
          new URL(`${baseUrl}/recordings/${recordingId}/access-link`),
          {}
        ),
        handleHttpClientError(
          'HTTP Client Error while fetching recording link'
        ),
        handle404('Recording', { id: recordingId, baseUrl }),
        assertStatus(200),
        parseAs(ApiDailyCoRecordingLinkSchema),
        Effect.map((linkData) => linkData.download_link)
      )

    const fetchTranscriptAccessLink = (
      transcriptId: string
    ): Effect.Effect<
      string | undefined,
      | UnhandledError
      | ExternalAssertionError
      | AuthError
      | NotFoundError<'Transcript', { id: string }>
    > =>
      pipe(
        headersEffect,
        getRequestFromHeaders(
          httpClient,
          new URL(`${baseUrl}/transcript/${transcriptId}/access-link`),
          {}
        ),
        handleHttpClientError(
          'HTTP Client Error while fetching transcript link'
        ),
        handle404('Transcript', { id: transcriptId, baseUrl }),
        assertStatus(200),
        parseAs(ApiDailyCoTranscriptLinkSchema),
        Effect.map((linkData) => linkData.link)
      )

    const extractRoomNameFromUrl: typeof VideoCallClient.Service.extractRoomNameFromUrl =
      (url: string): VideoCallRoomName | undefined => {
        const urlParts = url.split('/')
        if (urlParts.length <= 1) return undefined

        return VideoCallRoomName.make(urlParts[urlParts.length - 1]!)
      }

    const getMediaRecordedInRoom: typeof VideoCallClient.Service.getMediaRecordedInRoom =
      (roomName: VideoCallRoomName) =>
        pipe(
          headersEffect,
          getRequestFromHeaders(httpClient, new URL(`${baseUrl}/recordings`), {
            urlParams: {
              room_name: roomName,
            },
          }),
          handleHttpClientError(
            'HTTP Client Error while fetching recordings for room'
          ),
          assertStatus(200),
          parseAs(ApiDailyCoRecordingSchema),
          Effect.flatMap((apiDailyCoRecordings) =>
            Effect.all(
              apiDailyCoRecordings.data.map((rec) =>
                Effect.gen(function* () {
                  const recordingFileUrl = yield* fetchRecordingFileUrl(rec.id)

                  if (!recordingFileUrl) {
                    return undefined
                  }

                  const startedAtUtc = DateTime.unsafeMake(rec.start_ts * 1000)

                  return Media.make({
                    domainType: 'Media' as const,
                    status: 'completed' as const,
                    identifier: [
                      IdentifierAndReference.Identifier.make({ value: rec.id }),
                    ],
                    createdDateTime: startedAtUtc,
                    duration: rec.duration,
                    content: Attachment.Attachment.make({
                      dataUrl: recordingFileUrl,
                    }),
                  })
                })
              )
            )
          ),
          Effect.map((mediaWithFreshUrls) =>
            mediaWithFreshUrls.filter(
              (media): media is Media => media !== undefined
            )
          )
        )

    const listAllRecordings: typeof VideoCallClient.Service.listAllRecordings =
      (sinceTimestamp?: DateTime.Utc) =>
        Effect.gen(function* () {
          const allMedia: MediaWithRoom[] = []
          let cursor: string | undefined = sinceTimestamp?.epochMillis
            ? String(sinceTimestamp?.epochMillis)
            : undefined

          let hasMore = true
          while (hasMore) {
            const url = new URL(`${baseUrl}/recordings`)
            url.searchParams.set('limit', '100')
            if (cursor) {
              url.searchParams.set('starting_after', cursor)
            }

            const page = yield* pipe(
              headersEffect,
              getRequestFromHeaders(httpClient, url, {}),
              handleHttpClientError('Error while listing all recordings'),
              assertStatus(200),
              parseAs(ApiDailyCoRecordingSchema)
            )

            for (const rec of page.data) {
              const recordingFileUrl = yield* fetchRecordingFileUrl(rec.id)
              if (!recordingFileUrl) continue

              const startedAtUtc = DateTime.unsafeMake(rec.start_ts * 1000)
              const media = Media.make({
                domainType: 'Media' as const,
                status: 'completed' as const,
                identifier: [
                  IdentifierAndReference.Identifier.make({ value: rec.id }),
                ],
                createdDateTime: startedAtUtc,
                duration: rec.duration,
                content: Attachment.Attachment.make({
                  dataUrl: recordingFileUrl,
                }),
              })
              allMedia.push({ media, roomName: rec.room_name })
            }

            if (page.data.length < 100) {
              hasMore = false
            } else {
              const lastRec = page.data[page.data.length - 1]!
              cursor = lastRec.id
            }
          }

          return allMedia
        })

    const listAllTranscripts: typeof VideoCallClient.Service.listAllTranscripts =
      (sinceTimestamp?: DateTime.Utc) =>
        Effect.gen(function* () {
          const allMedia: MediaWithRoom[] = []
          let cursor: string | undefined = sinceTimestamp?.epochMillis
            ? String(sinceTimestamp)
            : undefined

          let hasMore = true
          while (hasMore) {
            const url = new URL(`${baseUrl}/transcript`)
            url.searchParams.set('limit', '100')
            if (cursor) {
              url.searchParams.set('starting_after', cursor)
            }

            const page = yield* pipe(
              headersEffect,
              getRequestFromHeaders(httpClient, url, {}),
              handleHttpClientError('Error while listing all transcripts'),
              assertStatus(200),
              parseAs(ApiDailyCoTranscriptSchema)
            )

            for (const transcript of page.data) {
              if (transcript.status !== 'transcribed') continue

              const accessLink = yield* fetchTranscriptAccessLink(
                transcript.transcriptId
              )
              if (!accessLink) continue

              const roomName = transcript.roomName
                ? VideoCallRoomName.make(transcript.roomName)
                : undefined
              if (!roomName) continue

              const media = Media.make({
                domainType: 'Media' as const,
                status: 'completed' as const,
                type: CodeableConcept.make({
                  coding: [
                    Coding.Coding.make({
                      system: 'http://assessment.is/fhir/media-type',
                      code: Code.make('transcript'),
                      display: 'Transcript',
                    }),
                  ],
                }),
                identifier: [
                  IdentifierAndReference.Identifier.make({
                    value: transcript.transcriptId,
                  }),
                ],
                duration: transcript.duration,
                content: Attachment.Attachment.make({ dataUrl: accessLink }),
              })
              allMedia.push({ media, roomName })
            }

            if (page.data.length < 100) {
              hasMore = false
            } else {
              const lastTranscript = page.data[page.data.length - 1]!
              cursor = lastTranscript.transcriptId
            }
          }

          return allMedia
        })

    const createRoom: typeof VideoCallClient.Service.createRoom = (
      params: RoomCreationParams
    ): Effect.Effect<
      ExternalVideoCallRoom,
      UnhandledError | ExternalAssertionError | AuthError,
      never
    > =>
      Effect.gen(function* () {
        const expiryInstant = params.expiresAt
          ? params.expiresAt
          : (yield* DateTime.now).pipe(DateTime.addDuration('30 minutes'))
        const exp = Math.floor(expiryInstant.epochMillis / 1000)

        const url = new URL(`${baseUrl}/rooms`)

        const body = {
          properties: {
            exp,
            enable_chat: params.enableChat ?? false,
            enable_recording: params.enableRecording ? 'cloud' : undefined,
            enable_transcription_storage: params.enableRecording ?? false,
            auto_transcription_settings: params.enableRecording
              ? { punctuate: true, model: 'nova-3-medical' }
              : undefined,
            ...(dailyCoConf.recordingsBucket && {
              recordings_bucket: {
                bucket_name: dailyCoConf.recordingsBucket.bucket_name,
                bucket_region: dailyCoConf.recordingsBucket.bucket_region,
                assume_role_arn: dailyCoConf.recordingsBucket.assume_role_arn,
                allow_api_access: dailyCoConf.recordingsBucket.allow_api_access,
              },
              transcription_bucket: {
                bucket_name: dailyCoConf.recordingsBucket.bucket_name,
                bucket_region: dailyCoConf.recordingsBucket.bucket_region,
                assume_role_arn: dailyCoConf.recordingsBucket.assume_role_arn,
                allow_api_access: dailyCoConf.recordingsBucket.allow_api_access,
              },
            }),
          },
        }

        const apiDailyCoRoom = yield* pipe(
          headersEffect,
          postRequestFromHeaders(httpClient, url, body, {}),
          handleHttpClientError('HTTP Client Error while creating room'),
          assertStatus(200),
          parseAs(ApiDailyCoRoomSchema)
        )

        return {
          id: VideoCallRoomId.make(apiDailyCoRoom.id),
          roomName: VideoCallRoomName.make(apiDailyCoRoom.name),
          url: apiDailyCoRoom.url,
        }
      })

    const deleteRoom: typeof VideoCallClient.Service.deleteRoom = (
      roomName: VideoCallRoomName
    ) =>
      pipe(
        headersEffect,
        deleteRequestFromHeaders(
          httpClient,
          new URL(`${baseUrl}/rooms/${roomName}`),
          {}
        ),
        handleHttpClientError('HTTP Client Error while deleting room'),
        handle404('Room', { name: roomName, baseUrl }),
        assertStatus(200),
        Effect.asVoid
      )

    const getRoom: typeof VideoCallClient.Service.getRoom = (
      roomName: VideoCallRoomName
    ) =>
      pipe(
        headersEffect,
        getRequestFromHeaders(
          httpClient,
          new URL(`${baseUrl}/rooms/${roomName}`),
          {}
        ),
        handleHttpClientError('HTTP Client Error while fetching room'),
        handle404('Room', { name: roomName, baseUrl }),
        assertStatus(200),
        parseAs(ApiDailyCoRoomSchema),
        Effect.map((apiDailyCoRoom) => ({
          id: VideoCallRoomId.make(apiDailyCoRoom.id),
          roomName: VideoCallRoomName.make(apiDailyCoRoom.name),
          url: apiDailyCoRoom.url,
        }))
      )

    const createRoomToken: typeof VideoCallClient.Service.createRoomToken = (
      options
    ) =>
      pipe(
        headersEffect,
        postRequestFromHeaders(
          httpClient,
          new URL(`${baseUrl}/meeting-tokens`),
          {
            properties: {
              room_name: options.roomName,
              is_owner: options.is_owner ?? false,
            },
          },
          {}
        ),
        handleHttpClientError('HTTP Client Error while creating meeting token'),
        assertStatus(200),
        parseAs(ApiDailyCoMeetingTokenSchema),
        Effect.map((response) => MeetingTokenString.make(response.token))
      )

    const parseMeetingToken: typeof VideoCallClient.Service.parseMeetingToken =
      (token: MeetingTokenString) =>
        Effect.gen(function* () {
          const parts = token.split('.')
          if (parts.length !== 3) {
            return yield* new ExternalAssertionError({
              expected: 'JWT with 3 dot-separated segments',
              cause: token,
            })
          }
          const [_header, payloadString, _signature] = parts as [
            string,
            string,
            string,
          ]

          const payloadJson = yield* Effect.try({
            try: () => {
              const base64 = payloadString.replace(/-/g, '+').replace(/_/g, '/')
              const json = atob(base64)
              return JSON.parse(json) as unknown
            },
            catch: (cause) =>
              new ExternalAssertionError({
                expected: 'Valid base64-encoded JSON payload',
                cause,
              }),
          })

          const payload = yield* Schema.decodeUnknown(
            DailyCoMeetingTokenPayloadSchema
          )(payloadJson).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  expected: 'Meeting token payload matching schema',
                  cause,
                })
            )
          )

          return {
            roomName: VideoCallRoomName.make(payload.r),
            isOwner: payload.o,
          }
        })

    return {
      createRoom,
      getMediaRecordedInRoom,
      extractRoomNameFromUrl,
      listAllRecordings,
      listAllTranscripts,
      getRoom,
      deleteRoom,
      createRoomToken,
      parseMeetingToken,
    }
  })
)

// /**
//  * Creates a Daily.co VideoCallClient layer using proxy mode.
//  * Uses AuthDataService for authentication (frontend use case).
//  */
// export const DailyCoVideoCallClientLayer = (dailyCoConf: DailyCoConfig) =>
//   Layer.effect(
//     VideoCallClient,
//     Effect.gen(function* () {
//       const httpClient = yield* HttpClient
//       const authDataService = yield* AuthDataService

//       const headersEffect = Effect.map(
//         authDataService.authData,
//         ({ authToken }) =>
//           ({
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//             authorization: `Bearer ${authToken}`,
//           }) as Record<string, string>
//       )

//       return makeDailyCoClient(
//         httpClient,
//         dailyCoConf.dailyCoProxyUrl,
//         headersEffect,
//         dailyCoConf
//       )
//     }).pipe(
//       Effect.withSpan('DailyCoVideoCallClientLayer'),
//       Effect.provide(FetchHttpClient.layer)
//     )
//   )

// /**
//  * Creates a Daily.co VideoCallClient layer using direct API access.
//  * Uses an API key for authentication (backend/server use case).
//  */
// export const DailyCoDirectVideoCallClientLayer = (
//   dailyCoConf: DailyCoConfig,
//   apiKey: string
// ) =>
//   Layer.effect(
//     VideoCallClient,
//     Effect.gen(function* () {
//       const httpClient = yield* HttpClient

//       const headersEffect = Effect.succeed({
//         Authorization: `Bearer ${apiKey}`,
//       } as Record<string, string>)

//       return makeDailyCoClient(
//         httpClient,
//         'https://api.daily.co/v1',
//         headersEffect,
//         dailyCoConf
//       )
//     }).pipe(
//       Effect.withSpan('DailyCoDirectVideoCallClientLayer'),
//       Effect.provide(FetchHttpClient.layer)
//     )
//   )
