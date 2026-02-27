import { describe, expect } from 'vitest'
import { it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform/HttpClient'
import { DailyCoContext } from '@assessmentis/config-domain'
import {
  DailyCoMeetingTokenService,
  DailyCoMeetingTokenLayer,
} from './DailyCoMeetingTokenService'
import { MeetingTokenString } from '../MeetingTokenString'

/**
 * Create a fake JWT with the given payload.
 */
const makeFakeJwt = (payload: Record<string, unknown>): MeetingTokenString => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payloadStr = btoa(JSON.stringify(payload))
  const signature = 'fake-signature'
  return MeetingTokenString.make(`${header}.${payloadStr}.${signature}`)
}

const stubContext = Layer.succeed(DailyCoContext, {
  config: {
    _tag: 'daily_co' as const,
    dailyCoProxyUrl: 'http://localhost:3000',
  },
  authHeadersEffect: Effect.succeed({ Authorization: 'Bearer test' }),
})

// Stub HttpClient that returns dummy responses
const stubHttpClient = Layer.succeed(HttpClient, {
  get: () => Effect.die('not implemented'),
  post: () => Effect.die('not implemented'),
  del: () => Effect.die('not implemented'),
} as unknown as HttpClient)

const TestLayer = DailyCoMeetingTokenLayer.pipe(
  Layer.provide(stubContext),
  Layer.provide(stubHttpClient)
)

describe('DailyCoMeetingTokenService', () => {
  describe('parseMeetingToken', () => {
    it.effect('parses a valid token with room name and owner flag', () =>
      Effect.gen(function* () {
        const service = yield* DailyCoMeetingTokenService
        const token = makeFakeJwt({ r: 'my-room', o: true })
        const result = yield* service.parseMeetingToken(token)

        expect(result.roomName).toBe('my-room')
        expect(result.isOwner).toBe(true)
      }).pipe(Effect.provide(TestLayer))
    )

    it.effect('parses a token with owner=false', () =>
      Effect.gen(function* () {
        const service = yield* DailyCoMeetingTokenService
        const token = makeFakeJwt({ r: 'other-room', o: false })
        const result = yield* service.parseMeetingToken(token)

        expect(result.roomName).toBe('other-room')
        expect(result.isOwner).toBe(false)
      }).pipe(Effect.provide(TestLayer))
    )

    it.effect('fails for malformed token (not 3 segments)', () =>
      Effect.gen(function* () {
        const service = yield* DailyCoMeetingTokenService
        const token = MeetingTokenString.make('not-a-jwt')

        const result = yield* service
          .parseMeetingToken(token)
          .pipe(Effect.either)

        expect(result._tag).toBe('Left')
      }).pipe(Effect.provide(TestLayer))
    )

    it.effect('fails for invalid base64 payload', () =>
      Effect.gen(function* () {
        const service = yield* DailyCoMeetingTokenService
        const token = MeetingTokenString.make('a.!!!invalid!!!.c')

        const result = yield* service
          .parseMeetingToken(token)
          .pipe(Effect.either)

        expect(result._tag).toBe('Left')
      }).pipe(Effect.provide(TestLayer))
    )
  })
})
