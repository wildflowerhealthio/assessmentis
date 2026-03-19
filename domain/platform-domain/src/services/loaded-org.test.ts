import { Cause, Effect, Exit, Layer } from 'effect'
import { describe, expect, it, vi } from 'vitest'

import { BadDataError, NotFoundError } from '@assessmentis/ontology'

import { OrgSlug } from '../models/id-types'
import { CurrentOrg, DocumentStore } from '../tagClasses'
import { defaultOrg, mockDocumentStore, mockDocumentStoreImplementations } from './__tests__/mocks'
import { LiteralLoadedOrgLayer, LoadedOrg, LoadedOrgLayer } from './loaded-org'

describe('LoadedOrg', () => {
  const testOrgSlug = OrgSlug.make('test-org')

  describe('LiteralLoadedOrgLayer', () => {
    it('successfully decodes valid org data', async () => {
      const validOrgData = {
        emoji: '🏥',
        slug: 'test-org',
      }

      const program = Effect.gen(function* program() {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, validOrgData)))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value.slug).toBe('test-org')
      }
    })

    it('fails with NotFoundError for undefined data', async () => {
      const program = Effect.gen(function* program() {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, undefined)))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
        expect(error).toBeInstanceOf(NotFoundError)
      }
    })

    it('fails with UnhandledError for invalid schema', async () => {
      const invalidOrgData = {
        // Invalid: should be string
        slug: 123,
      }

      const program = Effect.gen(function* program() {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, invalidOrgData)))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('BadDataError')
        expect(error).toBeInstanceOf(BadDataError)
      }
    })
  })

  describe('LoadedOrgLayer', () => {
    it('successfully loads from DocumentStore', async () => {
      const validOrgData = defaultOrg()

      const mock = mockDocumentStore({
        get: vi.fn(mockDocumentStoreImplementations.get.returning(validOrgData)),
      })

      const testLayer = LoadedOrgLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* program() {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value.slug).toBe('test-org')
      }

      // Verify the mock was called
      // oxlint-disable-next-line typescript/unbound-method
      expect(mock.get).toHaveBeenCalledWith('orgs', testOrgSlug)
    })

    it('fails with NotFoundError when org not found in DocumentStore', async () => {
      const mock = mockDocumentStore({
        get: vi.fn(mockDocumentStoreImplementations.get.notFound()),
      })

      const testLayer = LoadedOrgLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(Layer.succeed(CurrentOrg, OrgSlug.make('nonexistent-org')))
      )

      const program = Effect.gen(function* program() {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isFailure(result)).toBe(true)
      if (Exit.isFailure(result)) {
        const error = Cause.squash(result.cause) as any
        expect(error._tag).toBe('NotFoundError')
      }

      // Verify the mock was called
      // oxlint-disable-next-line typescript/unbound-method
      expect(mock.get).toHaveBeenCalled()
    })
  })
})
