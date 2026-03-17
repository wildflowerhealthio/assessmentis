import { Effect, pipe } from 'effect'
import type { Readable } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'

import type { ResourceRequest } from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { CredentialError } from '@assessmentis/platform-domain'

import {
  assertStatus,
  getRequest,
  handle404,
  handleHttpClientError,
  parseAs,
} from './httpHelpers'
import { ApiDailyCoRecordingLinkSchema } from './models/ApiDailyCoRecordingLinkSchema'
import { ApiDailyCoTranscriptLinkSchema } from './models/ApiDailyCoTranscriptLinkSchema'
import type { SupportedClasses } from './DailyCoOrigin'

export type CommonErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

/** A Readable that produces auth headers via `asHeaders()`. */
export type AuthReadable = Readable.Readable<
  { asHeaders(): Record<string, string> },
  CredentialError,
  never
>

export type AnyRequest<T extends SupportedClasses> =
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
  auth: AuthReadable,
  recordingId: string
): Effect.Effect<string | undefined, CommonErrors> =>
  pipe(
    getRequest(
      httpClient,
      new URL(`${baseUrl}/recordings/${recordingId}/access-link`),
      {},
      auth
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
  auth: AuthReadable,
  transcriptId: string
): Effect.Effect<string | undefined, CommonErrors> =>
  pipe(
    getRequest(
      httpClient,
      new URL(`${baseUrl}/transcript/${transcriptId}/access-link`),
      {},
      auth
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
