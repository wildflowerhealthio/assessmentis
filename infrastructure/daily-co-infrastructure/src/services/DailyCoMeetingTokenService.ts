import { Context, Effect, Layer, pipe, Schema } from 'effect'
import { HttpClient } from '@effect/platform/HttpClient'
import { ExternalAssertionError } from '@assessmentis/ontology'
import type { AuthError, UnhandledError } from '@assessmentis/ontology'
import { DailyCoContext } from '@assessmentis/config-domain'
import { MeetingTokenString } from '../MeetingTokenString'
import { ApiDailyCoMeetingTokenSchema } from '../models/ApiDailyCoMeetingTokenSchema'
import { DailyCoMeetingTokenPayloadSchema } from '../models/DailyCoMeetingTokenPayloadSchema'
import {
  postRequestFromHeaders,
  handleHttpClientError,
  assertStatus,
  parseAs,
} from '../httpHelpers'

export interface MeetingTokenProperties {
  readonly roomName: string
  readonly isOwner: boolean
}

export class DailyCoMeetingTokenService extends Context.Tag(
  'DailyCoMeetingTokenService'
)<
  DailyCoMeetingTokenService,
  {
    readonly createRoomToken: (options: {
      roomName: string
      isOwner?: boolean
    }) => Effect.Effect<
      MeetingTokenString,
      UnhandledError | ExternalAssertionError | AuthError
    >

    readonly parseMeetingToken: (
      token: MeetingTokenString
    ) => Effect.Effect<MeetingTokenProperties, ExternalAssertionError>
  }
>() {}

export const DailyCoMeetingTokenLayer: Layer.Layer<
  DailyCoMeetingTokenService,
  never,
  HttpClient | DailyCoContext
> = Layer.effect(
  DailyCoMeetingTokenService,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient
    const { config: dailyCoConf, authHeadersEffect: headersEffect } =
      yield* DailyCoContext
    const baseUrl =
      typeof window === 'undefined'
        ? 'https://api.daily.co/v1'
        : dailyCoConf.dailyCoProxyUrl

    const createRoomToken: typeof DailyCoMeetingTokenService.Service.createRoomToken =
      (options) =>
        pipe(
          headersEffect,
          postRequestFromHeaders(
            httpClient,
            new URL(`${baseUrl}/meeting-tokens`),
            {
              properties: {
                room_name: options.roomName,
                is_owner: options.isOwner ?? false,
              },
            },
            {}
          ),
          handleHttpClientError(
            'HTTP Client Error while creating meeting token'
          ),
          assertStatus(200),
          parseAs(ApiDailyCoMeetingTokenSchema),
          Effect.map((response) => MeetingTokenString.make(response.token))
        )

    const parseMeetingToken: typeof DailyCoMeetingTokenService.Service.parseMeetingToken =
      (token: MeetingTokenString) =>
        Effect.gen(function* () {
          const parts = token.split('.')
          if (parts.length !== 3) {
            return yield* new ExternalAssertionError({
              expected: 'JWT with 3 dot-separated segments',
              cause: token,
            })
          }
          const [_header, payloadString, _signature] = parts as [
            string,
            string,
            string,
          ]

          const payloadJson = yield* Effect.try({
            try: () => {
              const base64 = payloadString
                .replace(/-/g, '+')
                .replace(/_/g, '/')
              const json = atob(base64)
              return JSON.parse(json) as unknown
            },
            catch: (cause) =>
              new ExternalAssertionError({
                expected: 'Valid base64-encoded JSON payload',
                cause,
              }),
          })

          const payload = yield* Schema.decodeUnknown(
            DailyCoMeetingTokenPayloadSchema
          )(payloadJson).pipe(
            Effect.mapError(
              (cause) =>
                new ExternalAssertionError({
                  expected: 'Meeting token payload matching schema',
                  cause,
                })
            )
          )

          return {
            roomName: payload.r,
            isOwner: payload.o,
          }
        })

    return {
      createRoomToken,
      parseMeetingToken,
    }
  })
)
