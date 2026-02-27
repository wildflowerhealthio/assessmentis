import type { HttpClientError } from '@effect/platform'
import { HttpBody } from '@effect/platform'
import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect, pipe, Schema } from 'effect'
import {
  UnhandledError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import type { HttpClientResponse } from '@effect/platform/HttpClientResponse'
import { isHttpClientError } from '@effect/platform/HttpClientError'

export const getRequestFromHeaders =
  (
    httpClient: HttpClient,
    url: URL,
    options: Parameters<HttpClient['get']>[1]
  ) =>
  <E, R>(effect: Effect.Effect<Record<string, string>, E, R>) =>
    Effect.flatMap(effect, (authHeaders) => {
      return httpClient.get(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
          ...authHeaders,
        },
      })
    })

export const postRequestFromHeaders =
  (
    httpClient: HttpClient,
    url: URL,
    body: unknown,
    options: Parameters<HttpClient['post']>[1]
  ) =>
  <E, R>(
    effect: Effect.Effect<Record<string, string>, E, R>
  ): Effect.Effect<
    HttpClientResponse,
    E | UnhandledError | HttpClientError.HttpClientError,
    R
  > =>
    effect.pipe(
      Effect.flatMap((authHeaders) =>
        HttpBody.json(body).pipe(
          Effect.mapError(
            (cause) =>
              new UnhandledError({
                cause,
                message: 'Error serializing request body JSON',
              })
          ),
          Effect.map((body) => [authHeaders, body] as const)
        )
      ),
      Effect.flatMap(([authHeaders, body]) => {
        return httpClient.post(url, {
          ...options,
          body,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
            ...authHeaders,
          },
        })
      })
    )

export const deleteRequestFromHeaders =
  (
    httpClient: HttpClient,
    url: URL,
    options: Parameters<HttpClient['del']>[1]
  ) =>
  <E, R>(
    effect: Effect.Effect<Record<string, string>, E, R>
  ): Effect.Effect<
    HttpClientResponse,
    E | UnhandledError | HttpClientError.HttpClientError,
    R
  > =>
    effect.pipe(
      Effect.flatMap((authHeaders) => {
        return httpClient.del(url, {
          ...options,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
            ...authHeaders,
          },
        })
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
