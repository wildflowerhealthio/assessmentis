import { describe, expect, afterEach, beforeAll } from 'vitest'
import { it } from '@effect/vitest'
import { Effect } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import { describeAsFhirR4PatientClient } from '@assessmentis/fhir-r4/interface-tests'
import {
  LiveTestLayer,
  verifyGcloudAuth,
  testConfig,
  setMswContext,
} from '../helpers/test-config'
import { createTracker } from '../helpers/cleanup'

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
  beforeAll(() => {
    // Verify gcloud auth is configured before running tests
    verifyGcloudAuth()
    console.log(
      `Testing against FHIR store: ${testConfig.projectId}/${testConfig.dataset}/${testConfig.storeId}`
    )
    return setMswContext()
  })

  // Run base FHIR Patient interface tests
  describeAsFhirR4PatientClient(LiveTestLayer)

  // Patient-specific tests: executeBundle (stays in infrastructure)
  describe('executeBundle', () => {
    const tracker = createTracker()

    afterEach(async () => {
      // Cleanup created resources
      if (tracker.count > 0) {
        await Effect.runPromise(
          tracker.cleanup().pipe(Effect.provide(LiveTestLayer))
        )
      }
    })

    it.effect('should execute a transaction bundle', () =>
      Effect.gen(function* () {
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

        const response = result as {
          resourceType: string
          type: string
          entry?: Array<{
            response?: { status: string }
          }>
        }

        // Structural assertions
        expect(response.resourceType).toBe('Bundle')
        expect(response.type).toBe('transaction-response')
        expect(Array.isArray(response.entry)).toBe(true)
        if (response.entry && response.entry.length > 0) {
          expect(response.entry[0].response?.status).toMatch(/^2\d\d/)
        }
      }).pipe(Effect.provide(LiveTestLayer))
    )
  })
})
