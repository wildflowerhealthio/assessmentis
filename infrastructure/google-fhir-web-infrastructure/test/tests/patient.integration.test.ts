import { describe, expect } from 'vitest'
import { it } from '@effect/vitest'
import { Effect, Layer } from 'effect'

import { FhirR4Client } from '@assessmentis/fhir-r4'
import { describeAsFhirR4PatientClient } from '@assessmentis/fhir-r4/interface-tests'

import { createTracker } from '../helpers/cleanup'
import { setupClientOnWindow } from '../helpers/integration-setup'

/**
 * Live E2E tests for Patient CRUD operations against Google Healthcare API
 * using the web (gapi) client.
 *
 * These tests:
 * - Run against a real Google FHIR store (via mock gapi making real HTTP requests)
 * - Verify structural correctness (data shapes, status codes)
 * - Do NOT make assertions about content (data may vary)
 * - Can record cassettes for replay tests (RECORD=true)
 *
 * Prerequisites:
 * - gcloud auth login
 * - .env file with FHIR store configuration
 */
describe('Patient', async () => {
  await setupClientOnWindow()
  const client: typeof FhirR4Client.Service = (window as any)['client']
  if (!client) {
    throw new Error('FHIR client not initialized on window')
  }

  describeAsFhirR4PatientClient(Layer.succeed(FhirR4Client, client))

  // Patient-specific tests: executeBundle (stays in infrastructure)
  describe.skip('executeBundle', () => {
    const tracker = createTracker()

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
      }).pipe(
        Effect.provide(Layer.succeed(FhirR4Client, (window as any)['client']))
      )
    )
  })
})
