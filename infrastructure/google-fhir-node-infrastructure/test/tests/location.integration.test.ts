import { describe, beforeAll } from 'vitest'
import { describeAsFhirR4LocationClient } from '@assessmentis/fhir-client/interface-tests'
import {
  LiveTestLayer,
  verifyGcloudAuth,
  testConfig,
  setMswContext,
} from '../helpers/test-config'

/**
 * Live E2E tests for Location CRUD operations against Google Healthcare API.
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
describe('Location', () => {
  beforeAll(() => {
    // Verify gcloud auth is configured before running tests
    verifyGcloudAuth()
    console.log(
      `Testing against FHIR store: ${testConfig.projectId}/${testConfig.dataset}/${testConfig.storeId}`
    )
    return setMswContext()
  })

  // Run base FHIR Location interface tests
  describeAsFhirR4LocationClient(LiveTestLayer)
})
