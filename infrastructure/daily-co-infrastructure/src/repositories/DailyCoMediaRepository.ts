import { DateTime, Effect, Layer, pipe } from 'effect'
import { HttpClient } from '@effect/platform/HttpClient'
import { UnhandledError } from '@assessmentis/ontology'
import type {
  ClinicalDataRepository,
  ClinicalDataRepositoryErrors,
} from '@assessmentis/clinical-domain'
import { Media } from '@assessmentis/clinical-domain'
import {
  Attachment,
  IdentifierAndReference,
} from '@assessmentis/clinical-domain/data-types'
import { MediaRepository } from '@assessmentis/clinical-domain/repositories'
import { DailyCoContext } from '@assessmentis/config-domain'
import { ApiDailyCoRecordingSchema } from '../models/ApiDailyCoRecordingSchema'
import { ApiDailyCoRecordingLinkSchema } from '../models/ApiDailyCoRecordingLinkSchema'
import {
  getRequestFromHeaders,
  handleHttpClientError,
  handle404,
  assertStatus,
  parseAs,
} from '../httpHelpers'

/**
 * Fetch the signed download URL for a recording.
 */
const fetchRecordingFileUrl = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: Effect.Effect<
    Record<string, string>,
    ClinicalDataRepositoryErrors
  >,
  recordingId: string
): Effect.Effect<string | undefined, ClinicalDataRepositoryErrors> =>
  pipe(
    headersEffect,
    getRequestFromHeaders(
      httpClient,
      new URL(`${baseUrl}/recordings/${recordingId}/access-link`),
      {}
    ),
    handleHttpClientError('HTTP Client Error while fetching recording link'),
    handle404('Recording', { url: `${baseUrl}/recordings/${recordingId}` }),
    assertStatus(200),
    parseAs(ApiDailyCoRecordingLinkSchema),
    Effect.map((linkData) => linkData.download_link),
    Effect.catchTag('NotFoundError', () => Effect.succeed(undefined))
  )

/**
 * Result of getMany that includes the room name alongside the Media.
 * This is useful for consumers that need to correlate recordings with rooms.
 */
export interface MediaWithRoomName {
  readonly media: Media
  readonly roomName: string
}

/**
 * Implementation of ClinicalDataRepository<Media> backed by the Daily.co Recordings API.
 *
 * This repository is read-only — recordings are created by Daily.co during
 * video calls, not via this API.
 */
export const makeDailyCoMediaRepository = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: Effect.Effect<
    Record<string, string>,
    ClinicalDataRepositoryErrors
  >
): ClinicalDataRepository<Media> & {
  /**
   * List all recordings with pagination, returning room names alongside Media.
   */
  listAllRecordingsWithRoomName: (
    sinceTimestamp?: DateTime.Utc
  ) => Effect.Effect<MediaWithRoomName[], ClinicalDataRepositoryErrors>
} => ({
  get: () =>
    Effect.fail(
      new UnhandledError({
        message:
          'Daily.co recordings cannot be fetched by ID. Use getMany with room name filter.',
      })
    ),

  getMany: (params) => {
    const roomName = params?.encounter as string | undefined
    if (!roomName) {
      return Effect.fail(
        new UnhandledError({
          message:
            'Daily.co media repository requires a room name filter (pass as encounter param)',
        })
      )
    }

    return pipe(
      headersEffect,
      getRequestFromHeaders(httpClient, new URL(`${baseUrl}/recordings`), {
        urlParams: { room_name: roomName },
      }),
      handleHttpClientError(
        'HTTP Client Error while fetching recordings for room'
      ),
      assertStatus(200),
      parseAs(ApiDailyCoRecordingSchema),
      Effect.flatMap((apiRecordings) =>
        Effect.all(
          apiRecordings.data.map((rec) =>
            Effect.gen(function* () {
              const recordingFileUrl = yield* fetchRecordingFileUrl(
                httpClient,
                baseUrl,
                headersEffect,
                rec.id
              )

              if (!recordingFileUrl) return undefined

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
      Effect.map((results) =>
        results.filter((media): media is Media => media !== undefined)
      )
    ) as Effect.Effect<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ReadonlyArray<any>,
      ClinicalDataRepositoryErrors,
      never
    >
  },

  create: () =>
    Effect.fail(
      new UnhandledError({
        message:
          'Daily.co recordings are read-only and cannot be created via this repository',
      })
    ),

  createMany: () =>
    Effect.fail(
      new UnhandledError({
        message:
          'Daily.co recordings are read-only and cannot be created via this repository',
      })
    ),

  update: () =>
    Effect.fail(
      new UnhandledError({
        message:
          'Daily.co recordings are read-only and cannot be updated via this repository',
      })
    ),

  delete: () =>
    Effect.fail(
      new UnhandledError({
        message:
          'Daily.co recordings are read-only and cannot be deleted via this repository',
      })
    ),

  listAllRecordingsWithRoomName: (sinceTimestamp?: DateTime.Utc) =>
    Effect.gen(function* () {
      const allMedia: MediaWithRoomName[] = []
      let cursor: string | undefined = sinceTimestamp?.epochMillis
        ? String(sinceTimestamp.epochMillis)
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
          const recordingFileUrl = yield* fetchRecordingFileUrl(
            httpClient,
            baseUrl,
            headersEffect,
            rec.id
          )
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
    }),
})

/**
 * Layer providing MediaRepository backed by Daily.co recordings API.
 */
export const DailyCoMediaLayer: Layer.Layer<
  MediaRepository,
  never,
  HttpClient | DailyCoContext
> = Layer.effect(
  MediaRepository,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient
    const { config: dailyCoConf, authHeadersEffect: headersEffect } =
      yield* DailyCoContext
    const baseUrl =
      typeof window === 'undefined'
        ? 'https://api.daily.co/v1'
        : dailyCoConf.dailyCoProxyUrl

    return makeDailyCoMediaRepository(httpClient, baseUrl, headersEffect)
  })
)
