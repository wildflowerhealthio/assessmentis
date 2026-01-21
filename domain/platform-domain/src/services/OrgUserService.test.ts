import { describe, it, expect } from 'vitest'
import { Effect, Layer, Exit, Cause } from 'effect'
import { OrgUserService, OrgUserServiceLayer } from './OrgUserService'
import { CurrentOrg, CurrentUserId } from '../tagClasses'
import { OrgSlug } from '../models/IdTypes'
import { UserId } from '../models/UserId'
import { UnhandledError } from '@assessmentis/ontology'
import { AuthzError } from '../errors'
import { createMockDocumentStore, getImplementations } from './__tests__/mocks'

describe('OrgUserService', () => {
  const testOrgSlug = OrgSlug.make('test-org')
  
  describe('ensureRole', () => {
    it('succeeds when user has allowed role', async () => {
      const testUserId = UserId.make('user-with-admin')
      
      const rolesData = { roles: ['admin', 'viewer'] }

      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, rolesData],
        ]))
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
    })

    it('succeeds when user has one of multiple allowed roles', async () => {
      const testUserId = UserId.make('user-with-viewer')
      
      const rolesData = { roles: ['viewer'] }

      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, rolesData],
        ]))
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
    })

    it('fails with AuthzError when user lacks role', async () => {
      const testUserId = UserId.make('user-with-viewer')
      
      const rolesData = { roles: ['viewer'] }

      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, rolesData],
        ]))
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('AuthzError')
        expect(error).toBeInstanceOf(AuthzError)
      }
    })

    it('fails with AuthzError when user not in org', async () => {
      const testUserId = UserId.make('nonexistent-user')
      
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map())
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('AuthzError')
        expect(error).toBeInstanceOf(AuthzError)
      }
    })

    it('fails with UnhandledError when roles data is missing', async () => {
      const testUserId = UserId.make('user-no-roles')
      
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, { someOtherField: 'value' }],
        ]))
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
        expect(error).toBeInstanceOf(UnhandledError)
      }
    })

    it('fails with UnhandledError when roles is not an array', async () => {
      const testUserId = UserId.make('user-invalid-roles')
      
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, { roles: 'not-an-array' }],
        ]))
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
        expect(error).toBeInstanceOf(UnhandledError)
      }
    })

    it('fails with UnhandledError when data is null', async () => {
      const testUserId = UserId.make('user-null-data')
      
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, null as any],
        ]))
      )

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

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
        expect(error).toBeInstanceOf(UnhandledError)
      }
    })
  })
})
