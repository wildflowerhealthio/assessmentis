import { describe, expect, it, vi } from 'vitest'
import { Cause, Effect, Exit, Layer } from 'effect'

import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

import { OrgSlug } from '../models/IdTypes'
import { CurrentOrg, DocumentStore } from '../tagClasses'
import {
  defaultOrg,
  mockDocumentStore,
  mockDocumentStoreImplementations,
} from './__tests__/mocks'
import { LiteralLoadedOrgLayer, LoadedOrg, LoadedOrgLayer } from './LoadedOrg'

describe('LoadedOrg', () => {
  const testOrgSlug = OrgSlug.make('test-org')

  describe('LiteralLoadedOrgLayer', () => {
    it('successfully decodes valid org data', async () => {
      const validOrgData = {
        slug: 'test-org',
        frontendConfig: {
          fhirServer: {
            _tag: 'not_implemented' as const,
          },
          videoCallClient: {
            _tag: 'not_implemented' as const,
          },
        },
      }

      const program = Effect.gen(function* () {
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
      const program = Effect.gen(function* () {
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
        slug: 123, // Invalid: should be string
        frontendConfig: {
          logoUrl: 'https://example.com/logo.png',
        },
      }

      const program = Effect.gen(function* () {
        const org = yield* LoadedOrg
        return org
      }).pipe(
        Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, invalidOrgData))
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

  describe('LoadedOrgLayer', () => {
    it('successfully loads from DocumentStore', async () => {
      const validOrgData = defaultOrg()

      const mock = mockDocumentStore({
        get: vi.fn(
          mockDocumentStoreImplementations.get.returning(validOrgData)
        ),
      })

      const testLayer = LoadedOrgLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromiseExit(program)
      expect(Exit.isSuccess(result)).toBe(true)
      if (Exit.isSuccess(result)) {
        expect(result.value.slug).toBe('test-org')
      }

      // Verify the mock was called
      expect(mock.get).toHaveBeenCalledWith('orgs', testOrgSlug)
    })

    it('fails with NotFoundError when org not found in DocumentStore', async () => {
      const mock = mockDocumentStore({
        get: vi.fn(mockDocumentStoreImplementations.get.notFound()),
      })

      const testLayer = LoadedOrgLayer.pipe(
        Layer.provide(Layer.succeed(DocumentStore, mock)),
        Layer.provide(
          Layer.succeed(CurrentOrg, OrgSlug.make('nonexistent-org'))
        )
      )

      const program = Effect.gen(function* () {
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
      expect(mock.get).toHaveBeenCalled()
    })
  })
})
