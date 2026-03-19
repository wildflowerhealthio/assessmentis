// eslint-disable-next-line import/no-unassigned-import -- Loads environment variables from .env
import 'dotenv/config'

import { execSync } from 'node:child_process'
import { Layer } from 'effect'

import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { setupNodeIntercepting } from '@assessmentis/testing-utils/vcr-js/node'

import { HttpResponse, http } from 'msw'

import { GCloudAccessToken } from '../../src/g-cloud-access-token'
import { NodeGoogleHealthcareFhirR4ClientLayer } from '../../src/node-google-healthcare-client-layer'

export const testConfig = {
  _tag: 'google_fhir_store' as const,
  dataset: process.env.FHIR_DATASET ?? 'integration-test',
  projectId: process.env.FHIR_PROJECT_ID ?? 'assessmentis',
  region: process.env.FHIR_REGION ?? 'northamerica-northeast2',
  storeId: process.env.FHIR_STORE ?? 'integration-store-1',
}

export const GOOGLE_HEALTHCARE_BASE = 'https://healthcare.googleapis.com'

export const buildApiPath = (resourceType?: string, id?: string) => {
  const { projectId, region, dataset, storeId } = testConfig
  let path = `/v1/projects/${projectId}/locations/${region}/datasets/${dataset}/fhirStores/${storeId}/fhir`
  if (resourceType) {
    path += `/${resourceType}`
    if (id) {
      path += `/${id}`
    }
  }
  return path
}

/**
 * Get access token from gcloud CLI
 */
export const getGcloudToken = (): string => {
  if (import.meta.env.VITE_RECORD !== 'true') {
    return 'mock-access-token-for-testing'
  }
  try {
    const token = execSync('gcloud auth print-access-token', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    if (!token) {
      throw new Error('Empty token returned')
    }
    return token
  } catch (error) {
    let originalMessage = String(error)
    if (error instanceof Error) {
      originalMessage = error.message
    }
    throw new Error(
      'Failed to get gcloud access token. Ensure you are authenticated with:\n' +
        '  gcloud auth login' +
        '\nOriginal error: ' +
        originalMessage,
      { cause: error }
    )
  }
}

/**
 * Verify that gcloud auth is configured
 */
export const verifyGcloudAuth = (): void => {
  getGcloudToken()
}

/**
 * Create the live test layer with real Google Healthcare API
 * Uses gcloud CLI token for authentication
 */
export const LiveTestLayer = NodeGoogleHealthcareFhirR4ClientLayer.pipe(
  Layer.provide(Layer.succeed(LoadedGoogleFhirConfig, testConfig)),
  Layer.provide(Layer.sync(GCloudAccessToken, () => ({ token: getGcloudToken() })))
)

// Google metadata headers required for authentication
const metadataHeaders = {
  'Metadata-Flavor': 'Google',
}

// Create handlers for Google auth metadata endpoints to return mock credentials
const authHandlers = [
  // GCE metadata server - return mock instance info and token
  http.get('http://169.254.169.254/computeMetadata/v1/instance', () =>
    HttpResponse.json({ zone: 'projects/123456/zones/us-central1-a' }, { headers: metadataHeaders })
  ),
  http.get(
    'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',
    () =>
      HttpResponse.json(
        {
          access_token: 'mock-access-token-for-testing',
          expires_in: 3600,
          token_type: 'Bearer',
        },
        { headers: metadataHeaders }
      )
  ),
  http.get('http://169.254.169.254/computeMetadata/v1/project/project-id', () =>
    HttpResponse.text('mock-project-id', { headers: metadataHeaders })
  ),
  // Catch-all for any other metadata requests
  http.get('http://169.254.169.254/*', () => HttpResponse.json({}, { headers: metadataHeaders })),
  // Alternative metadata endpoint
  http.get('http://metadata.google.internal./computeMetadata/v1/*', () =>
    HttpResponse.json(
      {
        access_token: 'mock-access-token-for-testing',
        expires_in: 3600,
        token_type: 'Bearer',
      },
      { headers: metadataHeaders }
    )
  ),
]

// Setup hooks for MSW
export const setMswContext = async () => {
  const mswServer = await setupNodeIntercepting({
    handlers: authHandlers,
    hosts: [
      {
        name: 'Google Healthcare API',
        destinationHost: 'https://healthcare.googleapis.com',
        urlSubstitutions: [
          [
            /\/v1\/projects\/assessmentis\/locations\/[^/]*\/datasets\/[^/]*\/fhirStores\/[^/]*\/fhir/,
            'FHIR',
          ],
          [/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':uuid'],
        ],
      },
    ],
    tapePath: __dirname + '/../tapes/',
  })

  mswServer.listen({ onUnhandledRequest: 'error' })

  return () => {
    mswServer.close()
  }
}
