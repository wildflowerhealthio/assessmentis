import { describe, expect, it, vi } from 'vitest'
import { Cause, Effect, Exit, Layer } from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

import { UserId } from '../models/UserId'
import { CurrentUserId, DocumentStore } from '../tagClasses'
import {
  mockDocumentStore,
  mockDocumentStoreImplementations,
} from './__tests__/mocks'
import {
  LiteralLoadedUserLayer,
  LoadedUser,
  LoadedUserLayer,
} from './LoadedUser'

describe('LoadedUser', () => {
  const testUserId = UserId.make('user-123')

  describe('LiteralLoadedUserLayer', () => {
    it('successfully decodes valid user data', async () => {
      const validUserData = {
        uid: 'user-123',
        org_roles: {
          'test-org': ['admin', 'viewer'],
        },
      }

      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(Effect.provide(LiteralLoadedUserLayer(testUserId, validUserData)))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value.uid).toBe('user-123')
      }
    })

    it('fails with NotFoundError for undefined data', async () => {
      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(Effect.provide(LiteralLoadedUserLayer(testUserId, undefined)))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
        expect(error).toBeInstanceOf(NotFoundError)
      }
    })

    it('fails with UnhandledError for invalid schema', async () => {
      const invalidUserData = {
        uid: 123, // Invalid: should be string
        org_roles: {
          'test-org': ['admin'],
        },
      }

      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(
        Effect.provide(LiteralLoadedUserLayer(testUserId, invalidUserData))
      )

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
        expect(error).toBeInstanceOf(UnhandledError)
      }
    })
  })

  describe('LoadedUserLayer', () => {
    it('successfully loads from DocumentStore', async () => {
      const validUserData = {
        uid: 'user-123',
        org_roles: {
          'test-org': ['admin', 'viewer'],
        },
      }

      const mock = mockDocumentStore({
        get: vi.fn(
          mockDocumentStoreImplementations.get.returning(validUserData)
        ),
      })

      const testLayer = LoadedUserLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value.uid).toBe('user-123')
      }
    })

    it('fails with NotFoundError when user not found in DocumentStore', async () => {
      const mock = mockDocumentStore({
        get: vi.fn(mockDocumentStoreImplementations.get.notFound()),
      })

      const testLayer = LoadedUserLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: UserId.make('nonexistent-user'),
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
      }
    })

    it('fails with UnhandledError when user data is invalid', async () => {
      const invalidUserData = {
        uid: 123, // Invalid: should be string
        org_roles: {
          'test-org': ['admin'],
        },
      }

      const mock = mockDocumentStore({
        get: vi.fn(
          mockDocumentStoreImplementations.get.returning(invalidUserData)
        ),
      })

      const testLayer = LoadedUserLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
      }
    })
  })
})
