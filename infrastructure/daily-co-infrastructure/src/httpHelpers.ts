import { Effect, pipe, Schema } from 'effect'
import { HttpBody, type HttpClientError } from '@effect/platform'
import type { HttpClient } from '@effect/platform/HttpClient'
import { isHttpClientError } from '@effect/platform/HttpClientError'
import type { HttpClientResponse } from '@effect/platform/HttpClientResponse'

import {
  AuthError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { AuthReadable } from './resolverUtils'

/** Read auth headers from a Readable, mapping CredentialError → AuthError. */
const readHeaders = (auth: AuthReadable) =>
  auth.get.pipe(
    Effect.map((token) => token.asHeaders()),
    Effect.mapError(
      (cause) => new AuthError({ message: 'Credential unavailable', cause })
    )
  )

export const getRequest = (
  httpClient: HttpClient,
  url: URL,
  options: Parameters<HttpClient['get']>[1],
  auth: AuthReadable
) =>
  Effect.flatMap(readHeaders(auth), (authHeaders) =>
    httpClient.get(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
        ...authHeaders,
      },
    })
  )

export const postRequest = (
  httpClient: HttpClient,
  url: URL,
  body: unknown,
  options: Parameters<HttpClient['post']>[1],
  auth: AuthReadable
) =>
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
          ...(options?.headers ?? {}),
          ...authHeaders,
        },
      })
    )
  )

export const deleteRequest = (
  httpClient: HttpClient,
  url: URL,
  options: Parameters<HttpClient['del']>[1],
  auth: AuthReadable
) =>
  Effect.flatMap(readHeaders(auth), (authHeaders) =>
    httpClient.del(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
        ...authHeaders,
      },
    })
  )

export const handleHttpClientError =
  (message: string) =>
  <A, E, R>(resp: Effect.Effect<A, HttpClientError.HttpClientError | E, R>) =>
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
  <E, R>(resp: Effect.Effect<HttpClientResponse, E, R>) =>
    Effect.flatMap(resp, (resp) => {
      if (resp.status === 404) {
        return Effect.fail(
          new NotFoundError<ResourceType, Params>({ resourceType, params })
        )
      }
      return Effect.succeed(resp)
    })

export const assertStatus =
  (...allowedStatuses: number[]) =>
  <E, R>(resp: Effect.Effect<HttpClientResponse, E, R>) =>
    Effect.flatMap(resp, (resp) => {
      if (allowedStatuses.includes(resp.status)) return Effect.succeed(resp)
      return Effect.flatMap(
        resp.text.pipe(
          Effect.mapError(
            (responseError) =>
              new UnhandledError({
                cause: {
                  status: resp.status,
                  allowedStatuses,
                  responseError,
                  url: resp.request.url,
                },
                message: `Unexpected HTTP status: ${resp.status}, expected one of: ${allowedStatuses.join(', ')} AND an error reading body text`,
              })
          )
        ),
        (body) =>
          Effect.fail(
            new UnhandledError({
              message: `Unexpected HTTP status: ${resp.status}, expected one of: ${allowedStatuses.join(', ')}`,
              cause: {
                status: resp.status,
                allowedStatuses,
                url: resp.request.url,
                body,
              },
            })
          )
      )
    })

export const parseAs =
  <A, I, R1>(schema: Schema.Schema<A, I, R1>) =>
  <E, R2>(resp: Effect.Effect<HttpClientResponse, E, R2>) =>
    pipe(
      resp,
      Effect.flatMap((resp) =>
        Effect.catchAll(resp.json, (cause) =>
          Effect.fail(
            new ExternalAssertionError({
              expected: 'Valid JSON response',
              cause,
            })
          )
        )
      ),
      Effect.flatMap((json) =>
        Schema.decodeUnknown(schema)(json).pipe(
          Effect.catchAll((cause) =>
            Effect.fail(
              new ExternalAssertionError({
                expected: 'response matching schema',
                cause,
              })
            )
          )
        )
      )
    )
