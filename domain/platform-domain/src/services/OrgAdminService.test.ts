import { describe, it, expect } from 'vitest'
import { Effect, Layer, Either, Stream, Context } from 'effect'
import { OrgAdminService, OrgAdminServiceLayer } from './OrgAdminService'
import { CurrentOrg, DocumentStore } from '../tagClasses'
import { OrgSlug } from '../models/IdTypes'
import { UserId } from '../models/UserId'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

describe('OrgAdminService', () => {
  const testOrgSlug = OrgSlug.make('test-org')
  const testUserId = UserId.make('user-123')
  
  describe('getUser', () => {
    it('returns user when found', async () => {
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

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser(testUserId)
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right.uid).toBe('user-123')
      }
    })

    it('returns NotFoundError when user not found', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          return Effect.fail(
            new NotFoundError({
              resourceType: 'User',
              params: { userId: path[1] },
            })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser(UserId.make('nonexistent-user'))
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('NotFoundError')
      }
    })

    it('returns UnhandledError when user data is invalid', async () => {
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

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser(testUserId)
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
      }
    })
  })

  describe('getUserOrgRoles', () => {
    it('returns roles array when valid', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === testOrgSlug &&
            path[2] === 'users' &&
            path[3] === testUserId
          ) {
            return Effect.succeed({ roles: ['admin', 'viewer'] } as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'User', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(testUserId)
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right).toEqual(['admin', 'viewer'])
      }
    })

    it('returns NotFoundError when user not found in org', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          return Effect.fail(
            new NotFoundError({
              resourceType: 'User',
              params: { userId: path[3] },
            })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(UserId.make('nonexistent-user'))
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('NotFoundError')
      }
    })

    it('returns UnhandledError for invalid roles data', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === testOrgSlug &&
            path[2] === 'users' &&
            path[3] === testUserId
          ) {
            // Missing roles field
            return Effect.succeed({ someOtherField: 'value' } as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'User', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(testUserId)
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
      }
    })

    it('returns UnhandledError when roles is not an array', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === testOrgSlug &&
            path[2] === 'users' &&
            path[3] === testUserId
          ) {
            // roles is not an array
            return Effect.succeed({ roles: 'not-an-array' } as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'User', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(testUserId)
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
      }
    })
  })
})
