import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect, RequestResolver, Schema, pipe } from 'effect'

import type { Observation } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import { assertStatus, getRequest, handleHttpClientError, parseAs } from '../../http-helpers'
import { ApiDailyCoTranscriptSchema } from '../../models/api-daily-co-transcript-schema'
import { fetchTranscriptAccessLink } from '../../resolver-utils'
import type { AnyRequest, AuthReadable } from '../../resolver-utils'
import { DailyCoObservation } from './daily-co-observation'

const decodeObservation = Schema.decode(DailyCoObservation)

export const makeObservationResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  auth: AuthReadable
): RequestResolver.RequestResolver<AnyRequest<typeof Observation>> =>
  RequestResolver.fromEffect((request: AnyRequest<typeof Observation>) => {
    switch (request._tag) {
      case 'Get': {
        return Effect.fail(
          new UnhandledError({
            message: 'Daily.co transcripts cannot be fetched by ID. Use Search.',
          })
        )
      }
      case 'Search': {
        return Effect.gen(function* () {
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
        })
      }
      case 'Create':
      case 'Update':
      case 'Delete': {
        return Effect.fail(
          new UnhandledError({
            message: 'Daily.co transcripts are read-only and cannot be modified via this origin',
          })
        )
      }
    }
  })
