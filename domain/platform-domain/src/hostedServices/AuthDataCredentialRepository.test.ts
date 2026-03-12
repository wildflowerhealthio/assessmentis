import { describe, expect, test } from 'vitest'
import { Effect, Either, Stream } from 'effect'

import type { UserId } from '../models/UserId'
import { AuthDataService, type AuthData } from '../tagClasses/AuthDataService'
import type { CredentialToken } from '../tagClasses/CredentialRepository'
import {
  AuthDataLiveCredential,
  type AuthDataCredentialConstructor,
  makeAuthDataCredentialRepository,
} from './AuthDataCredentialRepository'

interface TestToken extends CredentialToken<TestToken, 'test'> {
  readonly _tag: 'test'
  readonly accessToken: string
  readonly expiresAt: undefined
}

const makeTestToken = (accessToken: string): TestToken => ({
  _tag: 'test',
  accessToken,
  expiresAt: undefined,
  asInvalidated() {
    return { ...this, accessToken: '' }
  },
})

class TestCredential extends AuthDataLiveCredential<'test', TestToken> {}

const TestCredentialConstructor: AuthDataCredentialConstructor<
  'test',
  TestToken
> = Object.assign(TestCredential, {
  fromAuthData: (authData: AuthData): TestToken =>
    makeTestToken(`access-for-${authData.userId}`),
})

const makeAuthData = (userId = 'user1' as UserId): AuthData => ({
  userId,
  authToken: 'token-123',
})

describe('makeAuthDataCredentialRepository', () => {
  test('creates a credential that starts in Loading state', async () => {
    const credential = await Effect.runPromise(
      makeAuthDataCredentialRepository(TestCredentialConstructor).pipe(
        Effect.provideService(AuthDataService, {
          authDataStream: Stream.never,
          authData: Effect.never,
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
      Effect.gen(function* () {
        const credential = yield* makeAuthDataCredentialRepository(
          TestCredentialConstructor
        ).pipe(
          Effect.provideService(AuthDataService, {
            authDataStream: Stream.make(Either.right(authData)),
            authData: Effect.succeed(authData),
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
          authDataStream: Stream.make(Either.right(authData)),
          authData: Effect.succeed(authData),
          shutdown: Effect.void,
        }),
        Effect.scoped
      )
    )
    // refresh should complete without error
    await Effect.runPromise(credential.refresh.pipe(Effect.scoped))
  })
})
