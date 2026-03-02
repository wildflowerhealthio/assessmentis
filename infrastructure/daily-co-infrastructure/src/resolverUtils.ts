import { Effect, pipe } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'
import type { Resource } from '@assessmentis/effectful-store'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ApiDailyCoRecordingLinkSchema } from './models/ApiDailyCoRecordingLinkSchema'
import { ApiDailyCoTranscriptLinkSchema } from './models/ApiDailyCoTranscriptLinkSchema'
import {
  getRequestFromHeaders,
  handleHttpClientError,
  handle404,
  assertStatus,
  parseAs,
} from './httpHelpers'

export type CommonErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

export type HeadersEffect = Effect.Effect<Record<string, string>, CommonErrors>

export type AnyRequest<T extends Resource.AnyResource> =
  | ResourceRequest.Get<T>
  | ResourceRequest.Search<T>
  | ResourceRequest.Create<T>
  | ResourceRequest.Update<T>
  | ResourceRequest.Delete<T>

/**
 * Extract the last path segment from a ReadonlyUrl pathname.
 */
export const extractIdFromUrl = (url: {
  readonly pathname: string
}): string => {
  const segments = url.pathname.split('/')
  return segments[segments.length - 1]!
}

/**
 * Fetch the signed download URL for a recording.
 */
export const fetchRecordingFileUrl = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: HeadersEffect,
  recordingId: string
): Effect.Effect<string | undefined, CommonErrors> =>
  pipe(
    headersEffect,
    getRequestFromHeaders(
      httpClient,
      new URL(`${baseUrl}/recordings/${recordingId}/access-link`),
      {}
    ),
    handleHttpClientError('HTTP Client Error while fetching recording link'),
    handle404('Recording', { url: `${baseUrl}/recordings/${recordingId}` }),
    assertStatus(200),
    parseAs(ApiDailyCoRecordingLinkSchema),
    Effect.map((linkData) => linkData.download_link),
    Effect.catchTag('NotFoundError', () => Effect.succeed(undefined))
  )

/**
 * Fetch the access link for a transcript.
 */
export const fetchTranscriptAccessLink = (
  httpClient: HttpClient,
  baseUrl: string,
  headersEffect: HeadersEffect,
  transcriptId: string
): Effect.Effect<string | undefined, CommonErrors> =>
  pipe(
    headersEffect,
    getRequestFromHeaders(
      httpClient,
      new URL(`${baseUrl}/transcript/${transcriptId}/access-link`),
      {}
    ),
    handleHttpClientError('HTTP Client Error while fetching transcript link'),
    handle404('Transcript', {
      url: `${baseUrl}/transcript/${transcriptId}`,
    }),
    assertStatus(200),
    parseAs(ApiDailyCoTranscriptLinkSchema),
    Effect.map((linkData) => linkData.link),
    Effect.catchTag('NotFoundError', () => Effect.succeed(undefined))
  )
