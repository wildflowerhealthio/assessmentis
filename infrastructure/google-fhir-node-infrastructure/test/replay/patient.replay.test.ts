import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { Effect, Exit, Cause, pipe, Option, Layer } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-client'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { NodeGoogleHealthcareFhirR4ClientLayer } from '../../src/NodeGoogleHealthcareClientLayer'
import { mswServer } from '../setup/replay.setup'
import { loadFixture } from '../helpers/fixture-loader'
import {
  createReadHandler,
  createCreateHandler,
  createSearchHandler,
  createNotFoundHandler,
  createUnauthorizedHandler,
  createForbiddenHandler,
} from '../handlers/fhir-handler-factory'
import { testConfig } from '../setup/test-config'

/**
 * Replay E2E tests for Patient CRUD operations using MSW.
 *
 * These tests use recorded fixtures from live tests to verify
 * that the implementation correctly handles API responses.
 */
describe('Patient CRUD (Replay)', () => {
  const ReplayTestLayer = NodeGoogleHealthcareFhirR4ClientLayer.pipe(
    Layer.provide(Layer.succeed(LoadedGoogleFhirConfig, testConfig))
  )

  beforeAll(() => {
    // Starts requests interception
    mswServer.listen()
  })

  beforeEach(() => {
    // Reset handlers before each test
    mswServer.resetHandlers()
  })

  afterAll(() => mswServer.close())

  describe('read', () => {
    it('should read a patient successfully', async () => {
      const fixture = loadFixture<{
        resourceType: string
        id: string
        name: Array<{ given: string[]; family: string }>
      }>('patient', 'read-success')

      // Set up MSW handler for this test
      mswServer.use(
        createReadHandler(
          fixture.request.resourceType,
          fixture.request.id!,
          fixture
        )
      )

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.read({
          resourceType: 'Patient',
          id: fixture.request.id!,
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const result = exit.value as {
          resourceType: string
          id: string
          name: Array<{ given: string[]; family: string }>
        }

        // Verify response matches fixture
        expect(result.resourceType).toBe(fixture.response.body.resourceType)
        expect(result.id).toBe(fixture.response.body.id)
        expect(result.name).toEqual(fixture.response.body.name)
      }
    })

    it('should return NotFoundError for non-existent patient', async () => {
      const fixture = loadFixture('patient', 'read-not-found')

      mswServer.use(
        createNotFoundHandler(fixture.request.resourceType, fixture.request.id!)
      )

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.read({
          resourceType: 'Patient',
          id: fixture.request.id!,
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = pipe(
          exit,
          Exit.causeOption,
          Option.flatMap(Cause.failureOption),
          Option.getOrThrow
        )
        expect((error as { _tag: string })._tag).toBe('NotFoundError')
      }
    })
  })

  describe('create', () => {
    it('should create a patient successfully', async () => {
      const fixture = loadFixture<{
        resourceType: string
        id: string
      }>('patient', 'create-success')

      mswServer.use(createCreateHandler('Patient', fixture))

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.create({
          type: 'Patient',
          resource: fixture.request.body,
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const result = exit.value as { resourceType: string; id: string }

        expect(result.resourceType).toBe('Patient')
        expect(result.id).toBe(fixture.response.body.id)
      }
    })
  })

  describe('search', () => {
    it('should return a searchset bundle', async () => {
      const fixture = loadFixture<{
        resourceType: string
        type: string
        total: number
        entry: unknown[]
      }>('patient', 'search-results')

      mswServer.use(createSearchHandler('Patient', fixture))

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.search({
          resourceType: 'Patient',
          _count: '10',
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const bundle = exit.value as {
          resourceType: string
          type: string
          total: number
          entry: unknown[]
        }

        expect(bundle.resourceType).toBe('Bundle')
        expect(bundle.type).toBe('searchset')
        expect(bundle.total).toBe(fixture.response.body.total)
        expect(bundle.entry.length).toBe(fixture.response.body.entry.length)
      }
    })
  })

  describe('error scenarios', () => {
    it('should handle 401 Unauthorized as AuthError', async () => {
      mswServer.use(createUnauthorizedHandler('Patient', 'test-id'))

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.read({
          resourceType: 'Patient',
          id: 'test-id',
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = pipe(
          exit,
          Exit.causeOption,
          Option.flatMap(Cause.failureOption),
          Option.getOrThrow
        )
        expect((error as { _tag: string })._tag).toBe('AuthError')
      }
    })

    it('should handle 403 Forbidden as AuthzError', async () => {
      mswServer.use(createForbiddenHandler('Patient', 'test-id'))

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.read({
          resourceType: 'Patient',
          id: 'test-id',
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = pipe(
          exit,
          Exit.causeOption,
          Option.flatMap(Cause.failureOption),
          Option.getOrThrow
        )
        expect((error as { _tag: string })._tag).toBe('AuthzError')
      }
    })
  })
})
