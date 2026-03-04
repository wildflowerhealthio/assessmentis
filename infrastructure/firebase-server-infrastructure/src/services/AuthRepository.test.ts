import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Cause, Effect, Exit } from 'effect'

import type { UserId } from '@assessmentis/platform-domain'

import { createMockFirestore } from './__tests__/mocks'
import { AuthRepository } from './AuthRepository'
import { FirebaseAdmin } from './FirebaseAdmin'

// Mock firebase-admin modules before imports
const mockFirestore = createMockFirestore()

vi.mock('firebase-admin/app', () => ({
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  initializeApp: vi.fn(),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
}))

describe('AuthRepository', () => {
  const testUserId = 'test-user-123' as UserId

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRefreshToken', () => {
    it('returns token when exists', async () => {
      const mockDoc = {
        get: vi.fn().mockResolvedValue({
          data: () => ({ token: 'refresh-token-abc' }),
        }),
      }
      const mockTokenCollection = {
        doc: vi.fn(() => mockDoc),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.getRefreshToken(testUserId)
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value).toBe('refresh-token-abc')
      }
      expect(mockFirestore.collection).toHaveBeenCalledWith('users')
      expect(mockUsersCollection.doc).toHaveBeenCalledWith(testUserId)
      expect(mockUserDoc.collection).toHaveBeenCalledWith('tokens')
      expect(mockTokenCollection.doc).toHaveBeenCalledWith(
        'googleOAuthRefreshToken'
      )
    })

    it('returns NotFoundError when token is missing', async () => {
      const mockDoc = {
        get: vi.fn().mockResolvedValue({
          data: () => undefined,
        }),
      }
      const mockTokenCollection = {
        doc: vi.fn(() => mockDoc),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.getRefreshToken(testUserId)
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
        if (error._tag === 'NotFoundError') {
          expect(error.resourceType).toBe('RefreshToken')
          expect(error.params).toEqual({ userId: testUserId })
        }
      }
    })

    it('returns NotFoundError when token field is not a string', async () => {
      const mockDoc = {
        get: vi.fn().mockResolvedValue({
          data: () => ({ token: 123 }), // Invalid type
        }),
      }
      const mockTokenCollection = {
        doc: vi.fn(() => mockDoc),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.getRefreshToken(testUserId)
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
      }
    })
  })

  describe('storeOAuthTokens', () => {
    it('successfully stores tokens', async () => {
      const mockAccessTokenDoc = {
        set: vi.fn().mockResolvedValue(undefined),
      }
      const mockRefreshTokenDoc = {
        set: vi.fn().mockResolvedValue(undefined),
      }
      const mockTokenCollection = {
        doc: vi.fn((docName: string) =>
          docName === 'googleOAuthAccessToken'
            ? mockAccessTokenDoc
            : mockRefreshTokenDoc
        ),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const tokens = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-abc',
        expiresAt: new Date('2026-01-22T00:00:00Z'),
        scope: 'read write',
        tokenType: 'Bearer',
      }

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.storeOAuthTokens(testUserId, tokens)
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(result)).toBe(true)
      expect(mockAccessTokenDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'access-token-xyz',
          expiresAt: tokens.expiresAt,
          scope: 'read write',
          tokenType: 'Bearer',
        })
      )
      expect(mockRefreshTokenDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'refresh-token-abc',
        })
      )
    })

    it('returns UnhandledError when storing fails', async () => {
      const mockAccessTokenDoc = {
        set: vi.fn().mockRejectedValue(new Error('Firestore error')),
      }
      const mockRefreshTokenDoc = {
        set: vi.fn().mockResolvedValue(undefined),
      }
      const mockTokenCollection = {
        doc: vi.fn((docName: string) =>
          docName === 'googleOAuthAccessToken'
            ? mockAccessTokenDoc
            : mockRefreshTokenDoc
        ),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const tokens = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-abc',
        expiresAt: new Date('2026-01-22T00:00:00Z'),
        scope: 'read write',
        tokenType: 'Bearer',
      }

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.storeOAuthTokens(testUserId, tokens)
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
      }
    })
  })

  describe('updateAccessToken', () => {
    it('successfully updates access token', async () => {
      const mockAccessTokenDoc = {
        set: vi.fn().mockResolvedValue(undefined),
      }
      const mockTokenCollection = {
        doc: vi.fn(() => mockAccessTokenDoc),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const expiresAt = new Date('2026-01-22T00:00:00Z')

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.updateAccessToken(
          testUserId,
          'new-access-token',
          expiresAt
        )
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(result)).toBe(true)
      expect(mockAccessTokenDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'new-access-token',
          expiresAt: expiresAt,
        })
      )
    })

    it('returns UnhandledError when update fails', async () => {
      const mockAccessTokenDoc = {
        set: vi.fn().mockRejectedValue(new Error('Firestore error')),
      }
      const mockTokenCollection = {
        doc: vi.fn(() => mockAccessTokenDoc),
      }
      const mockUserDoc = {
        collection: vi.fn(() => mockTokenCollection),
      }
      const mockUsersCollection = {
        doc: vi.fn(() => mockUserDoc),
      }
      mockFirestore.collection.mockReturnValue(mockUsersCollection as any)

      const expiresAt = new Date('2026-01-22T00:00:00Z')

      const program = Effect.gen(function* () {
        const repo = yield* AuthRepository
        return yield* repo.updateAccessToken(
          testUserId,
          'new-access-token',
          expiresAt
        )
      }).pipe(
        Effect.provide(AuthRepository.Default),
        Effect.provide(FirebaseAdmin.Default)
      )

      const result = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
      }
    })
  })
})
