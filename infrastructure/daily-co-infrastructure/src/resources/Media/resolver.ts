import { Effect, pipe, RequestResolver, Schema } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'
import type { Resource } from '@assessmentis/effectful-store'
import type { Media } from '@assessmentis/clinical-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { ApiDailyCoRecordingSchema } from '../../models/ApiDailyCoRecordingSchema'
import {
  getRequestFromHeaders,
  handleHttpClientError,
  assertStatus,
  parseAs,
} from '../../httpHelpers'
import type { AnyRequest, HeadersEffect } from '../../resolverUtils'
import { fetchRecordingFileUrl } from '../../resolverUtils'
import { DailyCoMedia } from './DailyCoMedia'

const decodeMedia = Schema.decodeSync(DailyCoMedia)

export const makeMediaResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: HeadersEffect
): RequestResolver.RequestResolver<AnyRequest<Media>, never> =>
  RequestResolver.fromEffect((request: AnyRequest<Media>) => {
    switch (request._tag) {
      case 'Get':
        return Effect.fail(
          new UnhandledError({
            message:
              'Daily.co recordings cannot be fetched by ID. Use Search with room name.',
          })
        )
      case 'Search':
        return Effect.gen(function* () {
          const roomName = request.params.encounter as string | undefined
          if (!roomName) {
            return yield* Effect.fail(
              new UnhandledError({
                message:
                  'Daily.co media search requires an encounter (room name) param',
              })
            )
          }

          const apiRecordings = yield* pipe(
            headersEffect,
            getRequestFromHeaders(
              httpClient,
              new URL(`${baseUrl}/recordings`),
              { urlParams: { room_name: roomName } }
            ),
            handleHttpClientError(
              'HTTP Client Error while fetching recordings'
            ),
            assertStatus(200),
            parseAs(ApiDailyCoRecordingSchema)
          )

          const results: Resource.WithResourceUrl<Media>[] = []
          for (const rec of apiRecordings.data) {
            const downloadLink = yield* fetchRecordingFileUrl(
              httpClient,
              baseUrl,
              headersEffect,
              rec.id
            )
            if (downloadLink) {
              results.push(
                decodeMedia({
                  id: rec.id,
                  start_ts: rec.start_ts,
                  duration: rec.duration,
                  downloadLink,
                  resourceUrl: `${baseUrl}/recordings/${rec.id}`,
                }) as Resource.WithResourceUrl<Media>
              )
            }
          }
          return results
        })
      case 'Create':
      case 'Update':
      case 'Delete':
        return Effect.fail(
          new UnhandledError({
            message:
              'Daily.co recordings are read-only and cannot be modified via this origin',
          })
        )
    }
  })
