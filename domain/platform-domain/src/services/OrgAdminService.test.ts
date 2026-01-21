import { describe, it, expect } from 'vitest'
import { Effect, Layer, Either, Stream } from 'effect'
import { OrgAdminService, OrgAdminServiceLayer } from './OrgAdminService'
import { CurrentOrg, DocumentStore } from '../tagClasses'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

describe('OrgAdminService', () => {
  describe('getUser', () => {
    it('returns user when found', async () => {
      const validUserData = {
        uid: 'user-123',
        org_roles: {
          'test-org': ['admin', 'viewer'],
        },
      }

      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (path[0] === 'users' && path[1] === 'user-123') {
            return Effect.succeed(validUserData)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser('user-123')
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
        get: (...path: string[]) => {
          return Effect.fail(
            new NotFoundError({
              resourceType: 'User',
              params: { userId: path[1] },
            })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser('nonexistent-user')
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
        get: (...path: string[]) => {
          if (path[0] === 'users' && path[1] === 'user-123') {
            return Effect.succeed(invalidUserData)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser('user-123')
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
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-123'
          ) {
            return Effect.succeed({ roles: ['admin', 'viewer'] })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'User', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles('user-123')
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
        get: (...path: string[]) => {
          return Effect.fail(
            new NotFoundError({
              resourceType: 'User',
              params: { userId: path[3] },
            })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles('nonexistent-user')
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
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-123'
          ) {
            // Missing roles field
            return Effect.succeed({ someOtherField: 'value' })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'User', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles('user-123')
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
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-123'
          ) {
            // roles is not an array
            return Effect.succeed({ roles: 'not-an-array' })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'User', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org'))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles('user-123')
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
