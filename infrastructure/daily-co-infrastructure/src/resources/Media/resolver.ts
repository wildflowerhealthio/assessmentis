import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect, RequestResolver, Schema, pipe } from 'effect'

import type { Media } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import { assertStatus, getRequest, handleHttpClientError, parseAs } from '../../http-helpers'
import { ApiDailyCoRecordingSchema } from '../../models/api-daily-co-recording-schema'
import { fetchRecordingFileUrl } from '../../resolver-utils'
import type { AnyRequest, AuthReadable } from '../../resolver-utils'
import { DailyCoMedia } from './daily-co-media'

const decodeMedia = Schema.decode(DailyCoMedia)

export const makeMediaResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  auth: AuthReadable
): RequestResolver.RequestResolver<AnyRequest<typeof Media>> =>
  RequestResolver.fromEffect((request: AnyRequest<typeof Media>) => {
    switch (request._tag) {
      case 'Get': {
        return Effect.fail(
          new UnhandledError({
            message: 'Daily.co recordings cannot be fetched by ID. Use Search with room name.',
          })
        )
      }
      case 'Search': {
        return Effect.gen(function* () {
          const encounterParam = request.params.encounter
          let roomName: string | undefined = undefined
          if (typeof encounterParam === 'string') {
            roomName = encounterParam
          } else if (Array.isArray(encounterParam)) {
            roomName = encounterParam[0]
          }
          if (!roomName) {
            return yield* Effect.fail(
              new UnhandledError({
                message: 'Daily.co media search requires an encounter (room name) param',
              })
            )
          }

          const apiRecordings = yield* pipe(
            getRequest(
              httpClient,
              new URL(`${baseUrl}/recordings`),
              { urlParams: { room_name: roomName } },
              auth
            ),
            handleHttpClientError('HTTP Client Error while fetching recordings'),
            assertStatus(200),
            parseAs(ApiDailyCoRecordingSchema)
          )

          const results: Resource.WithResourceUrl<Media>[] = []
          for (const rec of apiRecordings.data) {
            const downloadLink = yield* fetchRecordingFileUrl(httpClient, baseUrl, auth, rec.id)
            if (downloadLink) {
              const media = yield* decodeMedia({
                id: rec.id,
                start_ts: rec.start_ts,
                duration: rec.duration,
                downloadLink,
                resourceUrl: `${baseUrl}/recordings/${rec.id}`,
              }).pipe(
                Effect.mapError(
                  (cause) =>
                    new UnhandledError({
                      message: 'Error decoding Media from Daily.co recording',
                      cause,
                    })
                ),
                Effect.flatMap((m) => {
                  if (Resource.hasResourceUrl(m)) {
                    return Effect.succeed(m)
                  }
                  return Effect.fail(
                    new UnhandledError({
                      message: 'Expected Media to have url after decoding',
                    })
                  )
                })
              )
              results.push(media)
            }
          }
          return results
        })
      }
      case 'Create':
      case 'Update':
      case 'Delete': {
        return Effect.fail(
          new UnhandledError({
            message: 'Daily.co recordings are read-only and cannot be modified via this origin',
          })
        )
      }
    }
  })
