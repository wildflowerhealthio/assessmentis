import { Effect, pipe, RequestResolver, Schema } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'
import type { Resource } from '@assessmentis/effectful-store'
import type { Observation } from '@assessmentis/clinical-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { ApiDailyCoTranscriptSchema } from '../../models/ApiDailyCoTranscriptSchema'
import {
  getRequestFromHeaders,
  handleHttpClientError,
  assertStatus,
  parseAs,
} from '../../httpHelpers'
import type { AnyRequest, HeadersEffect } from '../../resolverUtils'
import { fetchTranscriptAccessLink } from '../../resolverUtils'
import { DailyCoObservation } from './DailyCoObservation'

const decodeObservation = Schema.decodeSync(DailyCoObservation)

export const makeObservationResolver = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: HeadersEffect
): RequestResolver.RequestResolver<AnyRequest<Observation>, never> =>
  RequestResolver.fromEffect((request: AnyRequest<Observation>) => {
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
              headersEffect,
              getRequestFromHeaders(httpClient, url, {}),
              handleHttpClientError('Error while listing transcripts'),
              assertStatus(200),
              parseAs(ApiDailyCoTranscriptSchema)
            )

            for (const transcript of page.data) {
              if (transcript.status !== 'transcribed') continue

              const accessLink = yield* fetchTranscriptAccessLink(
                httpClient,
                baseUrl,
                headersEffect,
                transcript.transcriptId
              )
              if (!accessLink) continue

              allObservations.push(
                decodeObservation({
                  transcriptId: transcript.transcriptId,
                  accessLink,
                  resourceUrl: `${baseUrl}/transcript/${transcript.transcriptId}`,
                }) as Resource.WithResourceUrl<Observation>
              )
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
