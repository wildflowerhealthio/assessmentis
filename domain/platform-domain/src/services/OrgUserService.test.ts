import { describe, it, expect } from 'vitest'
import { Effect, Layer, Either, Stream, Context } from 'effect'
import { OrgUserService, OrgUserServiceLayer } from './OrgUserService'
import { CurrentOrg, CurrentUserId, DocumentStore } from '../tagClasses'
import { OrgSlug } from '../models/IdTypes'
import { UserId } from '../models/UserId'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { AuthzError } from '../errors'

describe('OrgUserService', () => {
  const testOrgSlug = OrgSlug.make('test-org')
  
  describe('ensureRole', () => {
    it('succeeds when user has allowed role', async () => {
      const testUserId = UserId.make('user-with-admin')
      
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
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
      const testUserId = UserId.make('user-with-viewer')
      
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === testOrgSlug &&
            path[2] === 'users' &&
            path[3] === testUserId
          ) {
            return Effect.succeed({ roles: ['viewer'] } as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
      const testUserId = UserId.make('user-with-viewer')
      
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === testOrgSlug &&
            path[2] === 'users' &&
            path[3] === testUserId
          ) {
            return Effect.succeed({ roles: ['viewer'] } as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
      const testUserId = UserId.make('nonexistent-user')
      
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          // User not found in org
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
      const testUserId = UserId.make('user-no-roles')
      
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
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
      const testUserId = UserId.make('user-invalid-roles')
      
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
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
      const testUserId = UserId.make('user-null-data')
      
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (
            path[0] === 'orgs' &&
            path[1] === testOrgSlug &&
            path[2] === 'users' &&
            path[3] === testUserId
          ) {
            // data is null
            return Effect.succeed(null as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'users/*', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = OrgUserServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug)),
        Layer.provide(
          Layer.succeed(CurrentUserId, {
            userId: testUserId,
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
