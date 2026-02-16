import { describe } from 'vitest'
import { Layer } from 'effect'
import { FhirR4Client } from '@assessmentis/fhir-r4'
import { describeAsFhirR4LocationClient } from '@assessmentis/fhir-r4/interface-tests'
import { setupClientOnWindow } from '../helpers/integration-setup'

/**
 * Live E2E tests for Location CRUD operations against Google Healthcare API
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
describe('Location', async () => {
  await setupClientOnWindow()
  const client: typeof FhirR4Client.Service = (window as any)['client']
  if (!client) {
    throw new Error('FHIR client not initialized on window')
  }

  describeAsFhirR4LocationClient(Layer.succeed(FhirR4Client, client))
})
