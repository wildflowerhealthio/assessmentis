import { DateTime, Effect, Layer, pipe, Schema } from 'effect'
import { HttpClient } from '@effect/platform/HttpClient'
import { UnhandledError, NotFoundError } from '@assessmentis/ontology'
import type {
  ClinicalDataRepository,
  ClinicalDataRepositoryErrors,
} from '@assessmentis/clinical-domain'
import { Location } from '@assessmentis/clinical-domain'
import { LocationRepository } from '@assessmentis/clinical-domain/repositories'
import {
  VideoCallRoomIdentifier,
  findVideoCallRoomConfig,
  CodeableConcept,
  Coding,
  Code,
} from '@assessmentis/clinical-domain/data-types'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { DailyCoContext } from '@assessmentis/config-domain'
import { ApiDailyCoRoomSchema } from '../models/ApiDailyCoRoomSchema'
import {
  getRequestFromHeaders,
  postRequestFromHeaders,
  deleteRequestFromHeaders,
  handleHttpClientError,
  handle404,
  assertStatus,
  parseAs,
} from '../httpHelpers'

/**
 * Extract the room name from a Daily.co room URL.
 * The room name is the last path segment of the URL.
 */
const extractRoomNameFromUrl = (url: ReadonlyUrl): string | undefined => {
  const parts = url.pathname.split('/')
  const lastPart = parts[parts.length - 1]
  return lastPart && lastPart.length > 0 ? lastPart : undefined
}

/**
 * Build a Location resource from a Daily.co room API response.
 */
const roomToLocation = (room: {
  id: string
  name: string
  url: string
}): Location => {
  const roomUrl = ReadonlyUrl.make({
    protocol: 'https:',
    host: new URL(room.url).host,
    pathname: new URL(room.url).pathname,
  })

  return Location.make({
    domainType: 'Location' as const,
    name: room.name,
    status: 'active' as const,
    mode: 'instance' as const,
    physicalType: CodeableConcept.make({
      coding: [
        Coding.Coding.make({
          system:
            'http://terminology.hl7.org/CodeSystem/location-physical-type',
          code: Code.make('vi'),
          display: 'Virtual',
        }),
      ],
    }),
    identifier: [
      VideoCallRoomIdentifier.make({ value: room.name }).toIdentifier(),
    ],
    url: Schema.decodeSync(
      pipe(ReadonlyUrl.FromString, Schema.brand('Location/url'))
    )(room.url),
  })
}

/**
 * Implementation of ClinicalDataRepository<Location> backed by the Daily.co Rooms API.
 */
export const makeDailyCoLocationRepository = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: Effect.Effect<
    Record<string, string>,
    ClinicalDataRepositoryErrors
  >,
  dailyCoConf: {
    recordingsBucket?: {
      bucket_name: string
      bucket_region: string
      assume_role_arn: string
      allow_api_access: boolean
    }
  }
): ClinicalDataRepository<Location> => ({
  get: (id) => {
    const url =
      typeof id === 'string'
        ? id
        : id instanceof ReadonlyUrl
          ? extractRoomNameFromUrl(id)
          : undefined
    if (!url) {
      return Effect.fail(
        new NotFoundError({ resourceType: 'Location', params: { url: id } })
      )
    }
    const roomName = typeof id === 'string' && !id.startsWith('http') ? id : url

    return pipe(
      headersEffect,
      getRequestFromHeaders(
        httpClient,
        new URL(`${baseUrl}/rooms/${roomName}`),
        {}
      ),
      handleHttpClientError('HTTP Client Error while fetching room'),
      handle404('Location', { url: `${baseUrl}/rooms/${roomName}` }),
      assertStatus(200),
      parseAs(ApiDailyCoRoomSchema),
      Effect.map((apiRoom) => roomToLocation(apiRoom))
    )
  },

  getMany: () =>
    pipe(
      headersEffect,
      getRequestFromHeaders(httpClient, new URL(`${baseUrl}/rooms`), {}),
      handleHttpClientError('HTTP Client Error while listing rooms'),
      assertStatus(200),
      parseAs(
        Schema.Struct({
          data: Schema.Array(ApiDailyCoRoomSchema),
        })
      ),
      Effect.map((response) =>
        response.data.map((room) => roomToLocation(room))
      )
    ) as Effect.Effect<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ReadonlyArray<any>,
      ClinicalDataRepositoryErrors,
      never
    >,

  create: (location) =>
    Effect.gen(function* () {
      const roomIdentifier = VideoCallRoomIdentifier.findIn(location.identifier)
      const roomConfig = findVideoCallRoomConfig(location.extension)

      const expiryInstant = roomConfig?.expiresAt
        ? roomConfig.expiresAt
        : (yield* DateTime.now).pipe(DateTime.addDuration('30 minutes'))
      const exp = Math.floor(expiryInstant.epochMillis / 1000)

      const body = {
        ...(roomIdentifier ? { name: roomIdentifier.value } : {}),
        properties: {
          exp,
          enable_chat: roomConfig?.enableChat ?? false,
          enable_recording: roomConfig?.enableRecording ? 'cloud' : undefined,
          enable_transcription_storage: roomConfig?.enableRecording ?? false,
          auto_transcription_settings: roomConfig?.enableRecording
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

      const apiRoom = yield* pipe(
        headersEffect,
        postRequestFromHeaders(
          httpClient,
          new URL(`${baseUrl}/rooms`),
          body,
          {}
        ),
        handleHttpClientError('HTTP Client Error while creating room'),
        assertStatus(200),
        parseAs(ApiDailyCoRoomSchema)
      )

      return roomToLocation(apiRoom)
    }) as Effect.Effect<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      ClinicalDataRepositoryErrors,
      never
    >,

  createMany: (resources) =>
    Effect.all(
      resources.map((resource) =>
        (
          makeDailyCoLocationRepository(
            httpClient,
            baseUrl,
            headersEffect,
            dailyCoConf
          ).create as (
            r: Location
          ) => Effect.Effect<Location, ClinicalDataRepositoryErrors, never>
        )(resource)
      )
    ) as Effect.Effect<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ReadonlyArray<any>,
      ClinicalDataRepositoryErrors,
      never
    >,

  update: () =>
    Effect.fail(
      new UnhandledError({
        message: 'Daily.co rooms cannot be updated via this repository',
      })
    ),

  delete: (id) => {
    const roomName =
      typeof id === 'string' && !id.startsWith('http')
        ? id
        : id instanceof ReadonlyUrl
          ? extractRoomNameFromUrl(id)
          : typeof id === 'string'
            ? extractRoomNameFromUrl(
                ReadonlyUrl.make({
                  protocol: 'https:',
                  host: new URL(id).host,
                  pathname: new URL(id).pathname,
                })
              )
            : undefined

    if (!roomName) {
      return Effect.fail(
        new NotFoundError({ resourceType: 'Location', params: { url: id } })
      )
    }

    return pipe(
      headersEffect,
      deleteRequestFromHeaders(
        httpClient,
        new URL(`${baseUrl}/rooms/${roomName}`),
        {}
      ),
      handleHttpClientError('HTTP Client Error while deleting room'),
      handle404('Location', { url: `${baseUrl}/rooms/${roomName}` }),
      assertStatus(200),
      Effect.asVoid
    )
  },
})

/**
 * Layer providing LocationRepository backed by Daily.co rooms API.
 */
export const DailyCoLocationLayer: Layer.Layer<
  LocationRepository,
  never,
  HttpClient | DailyCoContext
> = Layer.effect(
  LocationRepository,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient
    const { config: dailyCoConf, authHeadersEffect: headersEffect } =
      yield* DailyCoContext
    const baseUrl =
      typeof window === 'undefined'
        ? 'https://api.daily.co/v1'
        : dailyCoConf.dailyCoProxyUrl

    return makeDailyCoLocationRepository(
      httpClient,
      baseUrl,
      headersEffect,
      dailyCoConf
    )
  })
)
