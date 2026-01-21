import { describe, it, expect } from 'vitest'
import { Effect, Layer, Either, Stream, Context } from 'effect'
import {
  LoadedOrg,
  LiteralLoadedOrgLayer,
  LoadedOrgLayer,
} from './LoadedOrg'
import { CurrentOrg, DocumentStore } from '../tagClasses'
import { OrgSlug } from '../models/IdTypes'
import { NotFoundError, UnhandledError } from '@assessmentis/ontology'

describe('LoadedOrg', () => {
  const testOrgSlug = OrgSlug.make('test-org')
  
  describe('LiteralLoadedOrgLayer', () => {
    it('successfully decodes valid org data', async () => {
      const validOrgData = {
        slug: 'test-org',
        frontendConfig: {
          fhirServer: {
            _tag: 'not_implemented',
          },
          videoCallClient: {
            _tag: 'not_implemented',
          },
        },
      }

      const program = Effect.gen(function* () {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, validOrgData)))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right.slug).toBe('test-org')
      }
    })

    it('fails with NotFoundError for undefined data', async () => {
      const program = Effect.gen(function* () {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, undefined)))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('NotFoundError')
        expect(result.left).toBeInstanceOf(NotFoundError)
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
      }).pipe(Effect.provide(LiteralLoadedOrgLayer(testOrgSlug, invalidOrgData)))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('UnhandledError')
        expect(result.left).toBeInstanceOf(UnhandledError)
      }
    })
  })

  describe('LoadedOrgLayer', () => {
    it('successfully loads from DocumentStore', async () => {
      const validOrgData = {
        slug: 'test-org',
        frontendConfig: {
          fhirServer: {
            _tag: 'not_implemented',
          },
          videoCallClient: {
            _tag: 'not_implemented',
          },
        },
      }

      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          if (path[0] === 'orgs' && path[1] === testOrgSlug) {
            return Effect.succeed(validOrgData as any)
          }
          return Effect.fail(
            new NotFoundError({ resourceType: 'orgs', params: {} })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = LoadedOrgLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, testOrgSlug))
      )

      const program = Effect.gen(function* () {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isRight(result)).toBe(true)
      if (Either.isRight(result)) {
        expect(result.right.slug).toBe('test-org')
      }
    })

    it('fails with NotFoundError when org not found in DocumentStore', async () => {
      const mockDocumentStore = Layer.succeed(DocumentStore, {
        get: ((...path: readonly string[]) => {
          return Effect.fail(
            new NotFoundError({
              resourceType: 'orgs',
              params: { orgSlug: path[1] },
            })
          )
        }) as Context.Tag.Service<typeof DocumentStore>['get'],
        subscribeTo: () => Stream.never,
      })

      const testLayer = LoadedOrgLayer.pipe(
        Layer.provide(mockDocumentStore),
        Layer.provide(Layer.succeed(CurrentOrg, OrgSlug.make('nonexistent-org')))
      )

      const program = Effect.gen(function* () {
        const org = yield* LoadedOrg
        return org
      }).pipe(Effect.provide(testLayer))

      const result = await Effect.runPromise(Effect.either(program))
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('NotFoundError')
      }
    })
  })
})
