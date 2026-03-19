import { HttpBody } from '@effect/platform'
import type { HttpClientError } from '@effect/platform'
import type { HttpClient } from '@effect/platform/HttpClient'
import { isHttpClientError } from '@effect/platform/HttpClientError'
import type { HttpClientResponse } from '@effect/platform/HttpClientResponse'
import { Effect, Schema, pipe } from 'effect'

import {
  AuthError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { AuthReadable } from './resolver-utils'

/** Read auth headers from a Readable, mapping CredentialError → AuthError. */
const readHeaders = (auth: AuthReadable): Effect.Effect<Record<string, string>, AuthError> =>
  auth.get.pipe(
    Effect.map((token) => token.asHeaders()),
    Effect.mapError((cause) => new AuthError({ cause, message: 'Credential unavailable' }))
  )

// To ensure callers don't accidentally pass other options here
type StrictHeaders<T> = Omit<NonNullable<T>, 'headers'> & {
  readonly headers?: Record<string, string>
}

export const getRequest = (
  httpClient: HttpClient,
  url: URL,
  options: StrictHeaders<Parameters<HttpClient['get']>[1]>,
  auth: AuthReadable
): Effect.Effect<HttpClientResponse, AuthError | HttpClientError.HttpClientError> =>
  Effect.flatMap(readHeaders(auth), (authHeaders) =>
    httpClient.get(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
        ...authHeaders,
      },
    })
  )

export const postRequest = (
  httpClient: HttpClient,
  url: URL,
  body: unknown,
  options: StrictHeaders<Parameters<HttpClient['post']>[1]>,
  auth: AuthReadable
): Effect.Effect<
  HttpClientResponse,
  AuthError | HttpClientError.HttpClientError | UnhandledError
> =>
  pipe(
    readHeaders(auth),
    Effect.flatMap((authHeaders) =>
      HttpBody.json(body).pipe(
        Effect.mapError(
          (cause) =>
            new UnhandledError({
              cause,
              message: 'Error serializing request body JSON',
            })
        ),
        Effect.map((jsonBody) => [authHeaders, jsonBody] as const)
      )
    ),
    Effect.flatMap(([authHeaders, jsonBody]) =>
      httpClient.post(url, {
        ...options,
        body: jsonBody,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options?.headers,
          ...authHeaders,
        },
      })
    )
  )

export const deleteRequest = (
  httpClient: HttpClient,
  url: URL,
  options: StrictHeaders<Parameters<HttpClient['del']>[1]>,
  auth: AuthReadable
): Effect.Effect<HttpClientResponse, AuthError | HttpClientError.HttpClientError> =>
  Effect.flatMap(readHeaders(auth), (authHeaders) =>
    httpClient.del(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
        ...authHeaders,
      },
    })
  )

export const handleHttpClientError =
  (message: string) =>
  <A, E, R>(
    resp: Effect.Effect<A, HttpClientError.HttpClientError | E, R>
  ): Effect.Effect<A, E | UnhandledError, R> =>
    Effect.catchIf(resp, isHttpClientError, (cause) =>
      Effect.fail(
        new UnhandledError({
          cause,
          message,
        })
      )
    )

export const handle404 =
  <ResourceType extends string, Params extends Record<string, unknown>>(
    resourceType: ResourceType,
    params: Params
  ) =>
  <E, R>(
    resp: Effect.Effect<HttpClientResponse, E, R>
  ): Effect.Effect<HttpClientResponse, E | NotFoundError<ResourceType, Params>, R> =>
    Effect.flatMap(resp, (response) => {
      if (response.status === 404) {
        return Effect.fail(new NotFoundError<ResourceType, Params>({ params, resourceType }))
      }
      return Effect.succeed(response)
    })

export const assertStatus =
  (...allowedStatuses: number[]) =>
  <E, R>(
    resp: Effect.Effect<HttpClientResponse, E, R>
  ): Effect.Effect<HttpClientResponse, E | UnhandledError, R> =>
    Effect.flatMap(resp, (response) => {
      if (allowedStatuses.includes(response.status)) {
        return Effect.succeed(response)
      }
      return Effect.flatMap(
        response.text.pipe(
          Effect.mapError(
            (responseError) =>
              new UnhandledError({
                cause: {
                  allowedStatuses,
                  responseError,
                  status: response.status,
                  url: response.request.url,
                },
                message: `Unexpected HTTP status: ${response.status}, expected one of: ${allowedStatuses.join(', ')} AND an error reading body text`,
              })
          )
        ),
        (body) =>
          Effect.fail(
            new UnhandledError({
              cause: {
                status: response.status,
                allowedStatuses,
                url: response.request.url,
                body,
              },
              message: `Unexpected HTTP status: ${response.status}, expected one of: ${allowedStatuses.join(', ')}`,
            })
          )
      )
    })

export const parseAs =
  <A, I, R1>(schema: Schema.Schema<A, I, R1>) =>
  <E, R2>(
    resp: Effect.Effect<HttpClientResponse, E, R2>
  ): Effect.Effect<A, E | ExternalAssertionError, R1 | R2> =>
    pipe(
      resp,
      Effect.flatMap((response) =>
        Effect.catchAll(response.json, (cause) =>
          Effect.fail(
            new ExternalAssertionError({
              cause,
              expected: 'Valid JSON response',
            })
          )
        )
      ),
      Effect.flatMap((json) =>
        Schema.decodeUnknown(schema)(json).pipe(
          Effect.catchAll((cause) =>
            Effect.fail(
              new ExternalAssertionError({
                cause,
                expected: 'response matching schema',
              })
            )
          )
        )
      )
    )
