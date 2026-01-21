import { describe, it, expect } from 'vitest'
import { Effect, Layer, Either, Stream } from 'effect'
import { OrgUserService, OrgUserServiceLayer } from './OrgUserService'
import { CurrentOrg, CurrentUserId, DocumentStore } from '../tagClasses'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { AuthzError } from '../errors'

describe('OrgUserService', () => {
  describe('ensureRole', () => {
    it('succeeds when user has allowed role', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-with-admin'
          ) {
            return Effect.succeed({ roles: ['admin', 'viewer'] })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'user-with-admin',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin'])
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
    })

    it('succeeds when user has one of multiple allowed roles', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-with-viewer'
          ) {
            return Effect.succeed({ roles: ['viewer'] })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'user-with-viewer',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin', 'viewer'])
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
    })

    it('fails with AuthzError when user lacks role', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-with-viewer'
          ) {
            return Effect.succeed({ roles: ['viewer'] })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'user-with-viewer',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin', 'superadmin']) // User doesn't have these
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('AuthzError')
        expect(result.left).toBeInstanceOf(AuthzError)
      }
    })

    it('fails with AuthzError when user not in org', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          // User not found in org
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'nonexistent-user',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin'])
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('AuthzError')
        expect(result.left).toBeInstanceOf(AuthzError)
      }
    })

    it('fails with UnhandledError when roles data is missing', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-no-roles'
          ) {
            // Missing roles field
            return Effect.succeed({ someOtherField: 'value' })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'user-no-roles',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin'])
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
        expect(result.left).toBeInstanceOf(UnhandledError)
      }
    })

    it('fails with UnhandledError when roles is not an array', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-invalid-roles'
          ) {
            // roles is not an array
            return Effect.succeed({ roles: 'not-an-array' })
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'user-invalid-roles',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin'])
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
        expect(result.left).toBeInstanceOf(UnhandledError)
      }
    })

    it('fails with UnhandledError when data is null', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: (...path: string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === 'test-org' &&
            path[2] === 'users' &&
            path[3] === 'user-null-data'
          ) {
            // data is null
            return Effect.succeed(null)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        },
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, 'test-org')),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: 'user-null-data',
            authToken: 'test-token',
          })
        )
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgUserService
        yield* service.ensureRole(['admin'])
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
        expect(result.left).toBeInstanceOf(UnhandledError)
      }
    })
  })
})
