import { describe, it, expect } from 'vitest'
import { Effect, Layer, Either, Stream, Context } from 'effect'
import {
  LoadedUser,
  LiteralLoadedUserLayer,
  LoadedUserLayer,
} from './LoadedUser'
import { CurrentUserId, DocumentStore } from '../tagClasses'
import { UserId } from '../models/UserId'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

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

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right.uid).toBe('user-123')
      }
    })

    it('fails with NotFoundError for undefined data', async () => {
      const program = Effect.gen(function* () {
        const user = yield* LoadedUser
        return user
      }).pipe(Effect.provide(LiteralLoadedUserLayer(testUserId, undefined)))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('NotFoundError')
        expect(result.left).toBeInstanceOf(NotFoundError)
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
      }).pipe(Effect.provide(LiteralLoadedUserLayer(testUserId, invalidUserData)))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
        expect(result.left).toBeInstanceOf(UnhandledError)
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

      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (path[0] === 'users' && path[1] === testUserId) {
            return Effect.succeed(validUserData as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = LoadedUserLayer.pipe(
        Layer.provide(mockDocumentStore),
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

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right.uid).toBe('user-123')
      }
    })

    it('fails with NotFoundError when user not found in DocumentStore', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          return Effect.fail(
            new NotFoundError({
              resourceType: 'users',
              params: { userId: path[1] },
            })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = LoadedUserLayer.pipe(
        Layer.provide(mockDocumentStore),
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

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('NotFoundError')
      }
    })

    it('fails with UnhandledError when user data is invalid', async () => {
      const invalidUserData = {
        uid: 123, // Invalid: should be string
        org_roles: {
          'test-org': ['admin'],
        },
      }

      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (path[0] === 'users' && path[1] === testUserId) {
            return Effect.succeed(invalidUserData as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = LoadedUserLayer.pipe(
        Layer.provide(mockDocumentStore),
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

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
      }
    })
  })
})
