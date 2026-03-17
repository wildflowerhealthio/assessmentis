import { Effect, pipe, RequestResolver, Schema } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'

import type { Observation } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import {
  assertStatus,
  getRequest,
  handleHttpClientError,
  parseAs,
} from '../../httpHelpers'
import { ApiDailyCoTranscriptSchema } from '../../models/ApiDailyCoTranscriptSchema'
import { fetchTranscriptAccessLink } from '../../resolverUtils'
import type { AnyRequest, AuthReadable } from '../../resolverUtils'
import { DailyCoObservation } from './DailyCoObservation'

const decodeObservation = Schema.decode(DailyCoObservation)

export const makeObservationResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  auth: AuthReadable
) =>
  RequestResolver.fromEffect((request: AnyRequest<typeof Observation>) => {
    switch (request._tag) {
      case 'Get':
        return Effect.fail(
          new UnhandledError({
            message:
              'Daily.co transcripts cannot be fetched by ID. Use Search.',
          })
        )
      case 'Search':
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
                      message:
                        'Error decoding Observation from Daily.co transcript',
                      cause,
                    })
                ),
                Effect.flatMap((o) =>
                  Resource.hasResourceUrl(o)
                    ? Effect.succeed(o)
                    : Effect.fail(
                        new UnhandledError({
                          message:
                            'Expected Observation to have url after decoding',
                        })
                      )
                )
              )
              allObservations.push(observation)
            }

            if (page.data.length < 100) {
              hasMore = false
            } else {
              const lastTranscript = page.data[page.data.length - 1]!
              cursor = lastTranscript.transcriptId
            }
          }

          return allObservations
        })
      case 'Create':
      case 'Update':
      case 'Delete':
        return Effect.fail(
          new UnhandledError({
            message:
              'Daily.co transcripts are read-only and cannot be modified via this origin',
          })
        )
    }
  })
