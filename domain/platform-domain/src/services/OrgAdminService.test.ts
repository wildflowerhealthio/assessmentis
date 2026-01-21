import { describe, it, expect } from 'vitest'
import { Effect, Layer, Exit, Cause } from 'effect'
import { OrgAdminService, OrgAdminServiceLayer } from './OrgAdminService'
import { CurrentOrg } from '../tagClasses'
import { OrgSlug } from '../models/IdTypes'
import { UserId } from '../models/UserId'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { createMockDocumentStore, getImplementations } from './__tests__/mocks'

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

      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`users/${testUserId}`, validUserData],
        ]))
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser(testUserId)
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value.uid).toBe('user-123')
      }
    })

    it('returns NotFoundError when user not found', async () => {
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map())
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser(UserId.make('nonexistent-user'))
        return user
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
      }
    })

    it('returns UnhandledError when user data is invalid', async () => {
      const invalidUserData = {
        uid: 123, // Invalid: should be string
        org_roles: {
          'test-org': ['admin'],
        },
      }

      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`users/${testUserId}`, invalidUserData],
        ]))
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const user = yield* service.getUser(testUserId)
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

  describe('getUserOrgRoles', () => {
    it('returns roles array when valid', async () => {
      const rolesData = { roles: ['admin', 'viewer'] }

      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, rolesData],
        ]))
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(testUserId)
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value).toEqual(['admin', 'viewer'])
      }
    })

    it('returns NotFoundError when user not found in org', async () => {
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map())
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(UserId.make('nonexistent-user'))
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
      }
    })

    it('returns UnhandledError for invalid roles data', async () => {
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, { someOtherField: 'value' }],
        ]))
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(testUserId)
        return roles
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('UnhandledError')
      }
    })

    it('returns UnhandledError when roles is not an array', async () => {
      const { layer: mockDocumentStore } = createMockDocumentStore(
        getImplementations.withData(new Map([
          [`orgs/${testOrgSlug}/users/${testUserId}`, { roles: 'not-an-array' }],
        ]))
      )

      const testLayer = OrgAdminServiceLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const service = yield* OrgAdminService
        const roles = yield* service.getUserOrgRoles(testUserId)
        return roles
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
