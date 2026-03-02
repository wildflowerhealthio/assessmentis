import { DateTime, Effect, pipe, RequestResolver, Schema } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'
import type { Resource } from '@assessmentis/effectful-store'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { Location } from '@assessmentis/clinical-domain'
import { Location as LocationClass } from '@assessmentis/clinical-domain'
import {
  VideoCallRoomIdentifier,
  findVideoCallRoomConfig,
  CodeableConcept,
  Coding,
  Code,
} from '@assessmentis/clinical-domain/data-types'
import type { DailyCoConfig } from '@assessmentis/config-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { ApiDailyCoRoomSchema } from '../../models/ApiDailyCoRoomSchema'
import {
  getRequestFromHeaders,
  postRequestFromHeaders,
  deleteRequestFromHeaders,
  handleHttpClientError,
  handle404,
  assertStatus,
  parseAs,
} from '../../httpHelpers'
import type { AnyRequest, HeadersEffect } from '../../resolverUtils'
import { extractIdFromUrl } from '../../resolverUtils'

/**
 * Build a Location from a Daily.co room API response.
 */
const roomToLocation = (room: {
  id: string
  name: string
  url: string
}): Resource.WithResourceUrl<Location> => {
  return LocationClass.make({
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
  }) as Resource.WithResourceUrl<Location>
}

export const makeLocationResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: HeadersEffect,
  config: DailyCoConfig
): RequestResolver.RequestResolver<AnyRequest<Location>, never> =>
  RequestResolver.fromEffect((request: AnyRequest<Location>) => {
    switch (request._tag) {
      case 'Get': {
        const roomName = extractIdFromUrl(request.url)
        return pipe(
          headersEffect,
          getRequestFromHeaders(
            httpClient,
            new URL(`${baseUrl}/rooms/${roomName}`),
            {}
          ),
          handleHttpClientError('HTTP Client Error while fetching room'),
          handle404('Location', { url: request.url }),
          assertStatus(200),
          parseAs(ApiDailyCoRoomSchema),
          Effect.map((apiRoom) => roomToLocation(apiRoom))
        )
      }
      case 'Search':
        return pipe(
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
        )
      case 'Create':
        return Effect.gen(function* () {
          const location = request.resource
          const roomIdentifier = VideoCallRoomIdentifier.findIn(
            location.identifier
          )
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
              enable_recording: roomConfig?.enableRecording
                ? 'cloud'
                : undefined,
              enable_transcription_storage:
                roomConfig?.enableRecording ?? false,
              auto_transcription_settings: roomConfig?.enableRecording
                ? { punctuate: true, model: 'nova-3-medical' }
                : undefined,
              ...(config.recordingsBucket && {
                recordings_bucket: {
                  bucket_name: config.recordingsBucket.bucket_name,
                  bucket_region: config.recordingsBucket.bucket_region,
                  assume_role_arn: config.recordingsBucket.assume_role_arn,
                  allow_api_access: config.recordingsBucket.allow_api_access,
                },
                transcription_bucket: {
                  bucket_name: config.recordingsBucket.bucket_name,
                  bucket_region: config.recordingsBucket.bucket_region,
                  assume_role_arn: config.recordingsBucket.assume_role_arn,
                  allow_api_access: config.recordingsBucket.allow_api_access,
                },
              }),
            },
          }

          return yield* pipe(
            headersEffect,
            postRequestFromHeaders(
              httpClient,
              new URL(`${baseUrl}/rooms`),
              body,
              {}
            ),
            handleHttpClientError('HTTP Client Error while creating room'),
            assertStatus(200),
            parseAs(ApiDailyCoRoomSchema),
            Effect.map((apiRoom) => roomToLocation(apiRoom))
          )
        })
      case 'Update':
        return Effect.fail(
          new UnhandledError({
            message: 'Daily.co rooms cannot be updated via this origin',
          })
        )
      case 'Delete': {
        const roomName = extractIdFromUrl(request.resource.url)
        return pipe(
          headersEffect,
          deleteRequestFromHeaders(
            httpClient,
            new URL(`${baseUrl}/rooms/${roomName}`),
            {}
          ),
          handleHttpClientError('HTTP Client Error while deleting room'),
          handle404('Location', { url: request.resource.url }),
          assertStatus(200),
          Effect.as(null)
        )
      }
    }
  })
