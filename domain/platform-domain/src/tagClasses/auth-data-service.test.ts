import { Effect, Either, Stream } from 'effect'
import { describe, expect, test } from 'vitest'

import { AuthError } from '@assessmentis/ontology'

import type { UserId } from '../models/user-id'
import { AuthDataService } from './auth-data-service'
import type { AuthData } from './auth-data-service'

const makeAuthData = (userId = 'user1' as UserId): AuthData => ({
  authToken: 'token-123',
  userId,
})

describe('AuthDataService.getAuthData', () => {
  test('returns auth data from first stream emission', () => {
    const authData = makeAuthData()
    const result = Effect.runSync(
      AuthDataService.getAuthData().pipe(
        Effect.provideService(AuthDataService, {
          authData: Effect.succeed(authData),
          authDataStream: Stream.make(Either.right(authData)),
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
          authData: Effect.fail(authError),
          authDataStream: Stream.make(Either.left(authError)),
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
          authData: Effect.fail(new AuthError({ message: 'no auth' })),
          authDataStream: Stream.empty,
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    expect(result._tag).toBe('Failure')
  })
})
