import type { HttpClient } from '@effect/platform/HttpClient'
import { DateTime, Effect, RequestResolver, Schema, pipe } from 'effect'

import { Location } from '@assessmentis/clinical-domain'
import {
  Code,
  CodeableConcept,
  Coding,
  VideoCallRoomIdentifier,
  findVideoCallRoomConfig,
} from '@assessmentis/clinical-domain/data-types'
import { Resource } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import type { DailyCoOriginDefinition } from '../../daily-co-origin-definition'
import {
  assertStatus,
  deleteRequest,
  getRequest,
  handle404,
  handleHttpClientError,
  parseAs,
  postRequest,
} from '../../http-helpers'
import { CompleteApiDailyCoRoom } from '../../models/api-daily-co-room-schema'
import { extractIdFromUrl } from '../../resolver-utils'
import type { AnyRequest, AuthReadable } from '../../resolver-utils'

const LocationUrl = Location.UrlSchema

/**
 * Build a Location from a Daily.co room API response.
 */
const roomToLocation = (room: {
  name: string
  url: string
}): Effect.Effect<Resource.WithResourceUrl<Location>, UnhandledError> =>
  Schema.decode(LocationUrl)(room.url).pipe(
    Effect.mapError(
      (cause) =>
        new UnhandledError({
          cause,
          message: `Invalid room URL: ${room.url}`,
        })
    ),
    Effect.flatMap((url) => {
      const location = Location.make({
        domainType: 'Location' as const,
        identifier: [VideoCallRoomIdentifier.make({ value: room.name }).toIdentifier()],
        mode: 'instance' as const,
        name: room.name,
        physicalType: CodeableConcept.make({
          coding: [
            Coding.make({
              system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
              code: Code.make('vi'),
              display: 'Virtual',
            }),
          ],
        }),
        status: 'active' as const,
        url,
      })
      if (Resource.hasResourceUrl(location)) {
        return Effect.succeed(location)
      }
      return Effect.fail(
        new UnhandledError({
          message: `Expected Location to have url after construction`,
        })
      )
    })
  )

export const makeLocationResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  auth: AuthReadable,
  config: DailyCoOriginDefinition
): RequestResolver.RequestResolver<AnyRequest<typeof Location>> =>
  RequestResolver.fromEffect((request: AnyRequest<typeof Location>) => {
    switch (request._tag) {
      case 'Get': {
        const roomName = extractIdFromUrl(request.url)
        return pipe(
          getRequest(httpClient, new URL(`${baseUrl}/rooms/${roomName}`), {}, auth),
          handleHttpClientError('HTTP Client Error while fetching room'),
          handle404('Location', { url: request.url }),
          assertStatus(200),
          parseAs(CompleteApiDailyCoRoom),
          Effect.flatMap((apiRoom) => roomToLocation(apiRoom))
        )
      }
      case 'Search': {
        return pipe(
          getRequest(httpClient, new URL(`${baseUrl}/rooms`), {}, auth),
          handleHttpClientError('HTTP Client Error while listing rooms'),
          assertStatus(200),
          parseAs(
            Schema.Struct({
              data: Schema.Array(CompleteApiDailyCoRoom),
            })
          ),
          Effect.flatMap((response) =>
            Effect.all(response.data.map((room) => roomToLocation(room)))
          )
        )
      }
      case 'Create': {
        return Effect.gen(function* () {
          const location = request.resource
          const roomIdentifier = VideoCallRoomIdentifier.findIn(location.identifier)
          const roomConfig = findVideoCallRoomConfig(location.extension)

          const expiryInstant =
            roomConfig?.expiresAt ?? (yield* DateTime.now).pipe(DateTime.addDuration('30 minutes'))
          const exp = Math.floor(expiryInstant.epochMillis / 1000)

          let nameField: { name: string } | Record<string, never> = {}
          if (roomIdentifier) {
            nameField = { name: roomIdentifier.value }
          }

          const recordingEnabled = roomConfig?.enableRecording ?? false
          let enableRecording: 'cloud' | undefined = undefined
          if (recordingEnabled) {
            enableRecording = 'cloud'
          }
          let autoTranscriptionSettings: { punctuate: true; model: string } | undefined = undefined
          if (recordingEnabled) {
            autoTranscriptionSettings = { punctuate: true, model: 'nova-3-medical' }
          }

          const body = {
            ...nameField,
            properties: {
              exp,
              enable_chat: roomConfig?.enableChat ?? false,
              enable_recording: enableRecording,
              enable_transcription_storage: recordingEnabled,
              auto_transcription_settings: autoTranscriptionSettings,
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
            postRequest(httpClient, new URL(`${baseUrl}/rooms`), body, {}, auth),
            handleHttpClientError('HTTP Client Error while creating room'),
            assertStatus(200),
            parseAs(CompleteApiDailyCoRoom),
            Effect.flatMap((apiRoom) => roomToLocation(apiRoom))
          )
        })
      }
      case 'Update': {
        return Effect.fail(
          new UnhandledError({
            message: 'Daily.co rooms cannot be updated via this origin',
          })
        )
      }
      case 'Delete': {
        const roomName = extractIdFromUrl(request.resource.url)
        return pipe(
          deleteRequest(httpClient, new URL(`${baseUrl}/rooms/${roomName}`), {}, auth),
          handleHttpClientError('HTTP Client Error while deleting room'),
          handle404('Location', { url: request.resource.url }),
          assertStatus(200),
          Effect.as(null)
        )
      }
    }
  })
