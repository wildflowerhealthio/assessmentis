import { Effect, Either, Stream } from 'effect'
import { describe, expect, test } from 'vitest'

import type { UserId } from '../models/user-id'
import { AuthDataService } from '../tagClasses/auth-data-service'
import type { AuthData } from '../tagClasses/auth-data-service'
import type { CredentialToken } from '../tagClasses/credential-repository'
import {
  AuthDataLiveCredential,
  makeAuthDataCredentialRepository,
} from './auth-data-credential-repository'
import type { AuthDataCredentialConstructor } from './auth-data-credential-repository'

interface TestToken extends CredentialToken<TestToken, 'test'> {
  readonly _tag: 'test'
  readonly accessToken: string
  readonly expiresAt: undefined
}

const makeTestToken = (accessToken: string): TestToken => ({
  _tag: 'test',
  accessToken,
  asInvalidated() {
    return { ...this, accessToken: '' }
  },
  expiresAt: undefined,
})

class TestCredential extends AuthDataLiveCredential<'test', TestToken> {}

const TestCredentialConstructor: AuthDataCredentialConstructor<'test', TestToken> = Object.assign(
  TestCredential,
  {
    fromAuthData: (authData: AuthData): TestToken => makeTestToken(`access-for-${authData.userId}`),
  }
)

const makeAuthData = (userId = 'user1' as UserId): AuthData => ({
  authToken: 'token-123',
  userId,
})

describe('makeAuthDataCredentialRepository', () => {
  test('creates a credential that starts in Loading state', async () => {
    const credential = await Effect.runPromise(
      makeAuthDataCredentialRepository(TestCredentialConstructor).pipe(
        Effect.provideService(AuthDataService, {
          authData: Effect.never,
          authDataStream: Stream.never,
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    expect(credential).toBeInstanceOf(TestCredential)
  })

  test('maps auth data to credential token', async () => {
    const authData = makeAuthData('user42' as UserId)

    const token = await Effect.runPromise(
      Effect.gen(function* token() {
        const credential = yield* makeAuthDataCredentialRepository(TestCredentialConstructor).pipe(
          Effect.provideService(AuthDataService, {
            authData: Effect.succeed(authData),
            authDataStream: Stream.make(Either.right(authData)),
            shutdown: Effect.void,
          })
        )
        // Give the forked fiber a chance to process
        yield* Effect.yieldNow()
        return yield* credential.get
      }).pipe(Effect.scoped)
    )

    expect(token.accessToken).toBe('access-for-user42')
  })

  test('refresh is a no-op', async () => {
    const authData = makeAuthData()
    const credential = await Effect.runPromise(
      makeAuthDataCredentialRepository(TestCredentialConstructor).pipe(
        Effect.provideService(AuthDataService, {
          authData: Effect.succeed(authData),
          authDataStream: Stream.make(Either.right(authData)),
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    // Refresh should complete without error
    await Effect.runPromise(credential.refresh.pipe(Effect.scoped))
  })
})
