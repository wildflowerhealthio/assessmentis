import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { Effect, Exit, Cause, pipe, Option } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-client'
import {
  LiveTestLayer,
  verifyGcloudAuth,
  testConfig,
} from '../helpers/test-config'
import { createTracker } from '../helpers/cleanup'
import { AuthError, AuthzError, UnhandledError } from '@assessmentis/ontology'

/**
 * Live E2E tests for Patient CRUD operations against Google Healthcare API.
 *
 * These tests:
 * - Run against a real Google FHIR store
 * - Verify structural correctness (data shapes, status codes)
 * - Do NOT make assertions about content (data may vary)
 * - Can record cassettes for replay tests (RECORD_FIXTURES=true)
 *
 * Prerequisites:
 * - gcloud auth login
 * - gcloud auth application-default login
 * - .env file with FHIR store configuration
 */
describe('Patient', () => {
  const tracker = createTracker()

  beforeAll(() => {
    // Verify gcloud auth is configured before running tests
    verifyGcloudAuth()
    console.log(
      `Testing against FHIR store: ${testConfig.projectId}/${testConfig.dataset}/${testConfig.storeId}`
    )
  })

  afterEach(async () => {
    // Cleanup created resources
    if (tracker.count > 0) {
      await Effect.runPromise(
        tracker.cleanup().pipe(Effect.provide(LiveTestLayer))
      )
    }
  })

  describe('create', () => {
    it('should create a patient and return with generated ID', async () => {
      const patientData = {
        resourceType: 'Patient' as const,
        name: [{ given: ['Live'], family: 'TestPatient' }],
        active: true,
      }

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        const result = yield* client.create({
          type: 'Patient',
          resource: patientData,
        })
        return result
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const result = exit.value as {
          resourceType: string
          id: string
          meta?: { versionId?: string }
        }

        // Structural assertions
        expect(result.resourceType).toBe('Patient')
        expect(typeof result.id).toBe('string')
        expect(result.id.length).toBeGreaterThan(0)

        // Track for cleanup
        tracker.track('Patient', result.id)
      }
    })
  })

  describe('read', () => {
    it('should read an existing patient by ID', async () => {
      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        // First create a patient
        const created = yield* client.create({
          type: 'Patient',
          resource: {
            resourceType: 'Patient',
            name: [{ given: ['ReadTest'], family: 'Patient' }],
          },
        })

        const createdPatient = created as { id: string }
        tracker.track('Patient', createdPatient.id)

        // Then read it back
        const result = yield* client.read({
          resourceType: 'Patient',
          id: createdPatient.id,
        })

        return { created: createdPatient, read: result }
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const { read } = exit.value as {
          created: { id: string }
          read: { resourceType: string; id: string }
        }

        // Structural assertions
        expect(read.resourceType).toBe('Patient')
        expect(read.id).toBe(exit.value.created.id)
      }
    })

    it('should return NotFoundError for non-existent patient', async () => {
      const nonExistentId = 'non-existent-patient-id-12345'

      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        return yield* client.read({
          resourceType: 'Patient',
          id: nonExistentId,
        })
      }).pipe(Effect.provide(LiveTestLayer))

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

  describe('update', () => {
    it('should update an existing patient', async () => {
      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        // Create initial patient
        const created = yield* client.create({
          type: 'Patient',
          resource: {
            resourceType: 'Patient',
            name: [{ given: ['Before'], family: 'Update' }],
          },
        })

        const createdPatient = created as { id: string }
        tracker.track('Patient', createdPatient.id)

        // Update the patient
        const updated = yield* client.update({
          type: 'Patient',
          id: createdPatient.id,
          resource: {
            resourceType: 'Patient',
            id: createdPatient.id,
            name: [{ given: ['After'], family: 'Update' }],
          },
        })

        return { created: createdPatient, updated }
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const { created, updated } = exit.value as {
          created: { id: string }
          updated: { resourceType: string; id: string }
        }

        // Structural assertions
        expect(updated.resourceType).toBe('Patient')
        expect(updated.id).toBe(created.id)
      }
    })
  })

  describe('delete', () => {
    it('should delete an existing patient', async () => {
      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        // Create a patient to delete
        const created = yield* client.create({
          type: 'Patient',
          resource: {
            resourceType: 'Patient',
            name: [{ given: ['ToDelete'], family: 'Patient' }],
          },
        })

        const createdPatient = created as { id: string }
        // Don't track - we're deleting it

        // Delete the patient
        yield* client.delete({
          type: 'Patient',
          id: createdPatient.id,
        })

        // Verify it's deleted by attempting to read
        const readResult = yield* pipe(
          client.read({
            resourceType: 'Patient',
            id: createdPatient.id,
          }),
          Effect.map(() => 'found' as const),
          (a) => a,
          Effect.catchTag(
            'NotFoundError',
            (
              _NotFoundError
            ): Effect.Effect<
              'not-found' | 'found',
              AuthError | AuthzError | UnhandledError
            > => Effect.succeed<'not-found' | 'found'>('not-found')
          )
        )

        return { deleted: createdPatient, readResult }
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const { deleted: _, readResult } = exit.value as {
          deleted: { id: string }
          readResult: 'found' | 'not-found'
        }

        expect(readResult).toBe('not-found')
      }
    })
  })

  describe('search', () => {
    it('should return a searchset bundle', async () => {
      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        const result = yield* client.search({
          resourceType: 'Patient',
          _count: '10',
        })

        return result
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const bundle = exit.value as {
          resourceType: string
          type: string
          total?: number
          entry?: unknown[]
        }

        // Structural assertions
        expect(bundle.resourceType).toBe('Bundle')
        expect(bundle.type).toBe('searchset')
        expect(
          typeof bundle.total === 'number' || bundle.total === undefined
        ).toBe(true)
      }
    })
  })

  describe('executeBundle', () => {
    it('should execute a transaction bundle', async () => {
      const program = Effect.gen(function* () {
        const client = yield* FhirR4Client

        const bundle = {
          resourceType: 'Bundle' as const,
          type: 'transaction' as const,
          entry: [
            {
              request: { method: 'POST' as const, url: 'Patient' },
              resource: {
                resourceType: 'Patient',
                name: [{ given: ['Bundle'], family: 'Test' }],
              },
            },
          ],
        }

        const result = yield* client.executeBundle(bundle as never)

        // Track created resources for cleanup
        const responseBundle = result as {
          entry?: Array<{
            response?: { location?: string }
          }>
        }
        responseBundle.entry?.forEach((entry) => {
          const location = entry.response?.location
          if (location) {
            const match = location.match(/Patient\/([^/]+)/)
            if (match) {
              tracker.track('Patient', match[1])
            }
          }
        })

        return result
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const responseBundle = exit.value as {
          resourceType: string
          type: string
          entry?: Array<{
            response?: { status: string }
          }>
        }

        // Structural assertions
        expect(responseBundle.resourceType).toBe('Bundle')
        expect(responseBundle.type).toBe('transaction-response')
        expect(Array.isArray(responseBundle.entry)).toBe(true)
        if (responseBundle.entry && responseBundle.entry.length > 0) {
          expect(responseBundle.entry[0].response?.status).toMatch(/^2\d\d/)
        }
      }
    })
  })
})
