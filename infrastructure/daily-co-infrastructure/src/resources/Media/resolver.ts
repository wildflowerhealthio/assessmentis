import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect, Request, Schema, pipe } from 'effect'
import type { RequestResolver } from 'effect'

import type { Media } from '@assessmentis/clinical-domain'
import {
  DiscriminatedRequestResolver,
  Resource,
  type ResourceRequest,
} from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import { assertStatus, getRequest, handleHttpClientError, parseAs } from '../../http-helpers'
import { ApiDailyCoRecordingSchema } from '../../models/api-daily-co-recording-schema'
import { fetchRecordingFileUrl } from '../../resolver-utils'
import type { AnyRequest, AuthReadable } from '../../resolver-utils'
import { DailyCoMedia } from './daily-co-media'

const decodeMedia = Schema.decode(DailyCoMedia)

const readOnlyError = new UnhandledError({
  message: 'Daily.co recordings are read-only and cannot be modified via this origin',
})

export const makeMediaResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  auth: AuthReadable
): RequestResolver.RequestResolver<AnyRequest<typeof Media>> =>
  DiscriminatedRequestResolver.fromBatchedRunners(
    '_tag',
    ['Media.Get', 'Media.Search', 'Media.Create', 'Media.Update', 'Media.Delete'] as const,
    {
      'Media.Get': (requests: readonly ResourceRequest.Get<typeof Media>[]) =>
        Effect.forEach(
          requests,
          (req) =>
            Request.fail(
              req,
              new UnhandledError({
                message: 'Daily.co recordings cannot be fetched by ID. Use Search with room name.',
              })
            ),
          { discard: true }
        ),
      'Media.Search': (requests: readonly ResourceRequest.Search<typeof Media>[]) =>
        Effect.forEach(
          requests,
          (request) =>
            Effect.gen(function* () {
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
            }).pipe(
              Effect.flatMap((v) => Request.succeed(request, v)),
              Effect.catchAll((e) => Request.fail(request, e)),
            ),
          { discard: true }
        ),
      'Media.Create': (requests: readonly ResourceRequest.Create<typeof Media>[]) =>
        Effect.forEach(requests, (req) => Request.fail(req, readOnlyError), { discard: true }),
      'Media.Update': (requests: readonly ResourceRequest.Update<typeof Media>[]) =>
        Effect.forEach(requests, (req) => Request.fail(req, readOnlyError), { discard: true }),
      'Media.Delete': (requests: readonly ResourceRequest.Delete<typeof Media>[]) =>
        Effect.forEach(requests, (req) => Request.fail(req, readOnlyError), { discard: true }),
    }
  )
