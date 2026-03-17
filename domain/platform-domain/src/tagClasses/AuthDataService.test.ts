import { describe, expect, test } from 'vitest'
import { Effect, Either, Stream } from 'effect'

import { AuthError } from '@assessmentis/ontology'

import type { UserId } from '../models/UserId'
import { AuthDataService } from './AuthDataService'
import type { AuthData } from './AuthDataService'

const makeAuthData = (userId = 'user1' as UserId): AuthData => ({
  userId,
  authToken: 'token-123',
})

describe('AuthDataService.getAuthData', () => {
  test('returns auth data from first stream emission', () => {
    const authData = makeAuthData()
    const result = Effect.runSync(
      AuthDataService.getAuthData().pipe(
        Effect.provideService(AuthDataService, {
          authDataStream: Stream.make(Either.right(authData)),
          authData: Effect.succeed(authData),
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    expect(result).toEqual(authData)
  })

  test('fails with AuthError when stream emits Left', () => {
    const authError = new AuthError({ message: 'not authenticated' })
    const result = Effect.runSyncExit(
      AuthDataService.getAuthData().pipe(
        Effect.provideService(AuthDataService, {
          authDataStream: Stream.make(Either.left(authError)),
          authData: Effect.fail(authError),
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    expect(result._tag).toBe('Failure')
  })

  test('fails with UnhandledError when stream is empty', () => {
    const result = Effect.runSyncExit(
      AuthDataService.getAuthData().pipe(
        Effect.provideService(AuthDataService, {
          authDataStream: Stream.empty,
          authData: Effect.fail(new AuthError({ message: 'no auth' })),
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    expect(result._tag).toBe('Failure')
  })
})
