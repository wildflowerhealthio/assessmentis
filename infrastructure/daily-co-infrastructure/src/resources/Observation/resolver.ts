import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect, Request, Schema, pipe } from 'effect'
import type { RequestResolver } from 'effect'

import type { Observation } from '@assessmentis/clinical-domain'
import {
  DiscriminatedRequestResolver,
  Resource,
  type ResourceRequest,
} from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import { assertStatus, getRequest, handleHttpClientError, parseAs } from '../../http-helpers'
import { ApiDailyCoTranscriptSchema } from '../../models/api-daily-co-transcript-schema'
import { fetchTranscriptAccessLink } from '../../resolver-utils'
import type { AnyRequest, AuthReadable } from '../../resolver-utils'
import { DailyCoObservation } from './daily-co-observation'

const decodeObservation = Schema.decode(DailyCoObservation)

const readOnlyError = new UnhandledError({
  message: 'Daily.co transcripts are read-only and cannot be modified via this origin',
})

export const makeObservationResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  auth: AuthReadable
): RequestResolver.RequestResolver<AnyRequest<typeof Observation>> =>
  DiscriminatedRequestResolver.fromBatchedRunners(
    '_tag',
    [
      'Observation.Get',
      'Observation.Search',
      'Observation.Create',
      'Observation.Update',
      'Observation.Delete',
    ] as const,
    {
      'Observation.Get': (requests: readonly ResourceRequest.Get<typeof Observation>[]) =>
        Effect.forEach(
          requests,
          (req) =>
            Request.fail(
              req,
              new UnhandledError({
                message: 'Daily.co transcripts cannot be fetched by ID. Use Search.',
              })
            ),
          { discard: true }
        ),
      'Observation.Search': (requests: readonly ResourceRequest.Search<typeof Observation>[]) =>
        Effect.forEach(
          requests,
          (request) =>
            Effect.gen(function* () {
              const allObservations: Resource.WithResourceUrl<Observation>[] = []
              let cursor: string | undefined
              let hasMore = true

              while (hasMore) {
                const url = new URL(`${baseUrl}/transcript`)
                url.searchParams.set('limit', '100')
                if (cursor) {
                  url.searchParams.set('starting_after', cursor)
                }

                const page = yield* pipe(
                  getRequest(httpClient, url, {}, auth),
                  handleHttpClientError('Error while listing transcripts'),
                  assertStatus(200),
                  parseAs(ApiDailyCoTranscriptSchema)
                )

                for (const transcript of page.data) {
                  if (transcript.status !== 'transcribed') continue

                  const accessLink = yield* fetchTranscriptAccessLink(
                    httpClient,
                    baseUrl,
                    auth,
                    transcript.transcriptId
                  )
                  if (!accessLink) continue

                  const observation = yield* decodeObservation({
                    transcriptId: transcript.transcriptId,
                    accessLink,
                    resourceUrl: `${baseUrl}/transcript/${transcript.transcriptId}`,
                  }).pipe(
                    Effect.mapError(
                      (cause) =>
                        new UnhandledError({
                          message: 'Error decoding Observation from Daily.co transcript',
                          cause,
                        })
                    ),
                    Effect.flatMap((o) => {
                      if (Resource.hasResourceUrl(o)) {
                        return Effect.succeed(o)
                      }
                      return Effect.fail(
                        new UnhandledError({
                          message: 'Expected Observation to have url after decoding',
                        })
                      )
                    })
                  )
                  allObservations.push(observation)
                }

                if (page.data.length < 100) {
                  hasMore = false
                } else {
                  const lastTranscript = page.data.at(-1)!
                  cursor = lastTranscript.transcriptId
                }
              }

              return allObservations
            }).pipe(
              Effect.flatMap((v) => Request.succeed(request, v)),
              Effect.catchAll((e) => Request.fail(request, e)),
            ),
          { discard: true }
        ),
      'Observation.Create': (requests: readonly ResourceRequest.Create<typeof Observation>[]) =>
        Effect.forEach(requests, (req) => Request.fail(req, readOnlyError), { discard: true }),
      'Observation.Update': (requests: readonly ResourceRequest.Update<typeof Observation>[]) =>
        Effect.forEach(requests, (req) => Request.fail(req, readOnlyError), { discard: true }),
      'Observation.Delete': (requests: readonly ResourceRequest.Delete<typeof Observation>[]) =>
        Effect.forEach(requests, (req) => Request.fail(req, readOnlyError), { discard: true }),
    }
  )
