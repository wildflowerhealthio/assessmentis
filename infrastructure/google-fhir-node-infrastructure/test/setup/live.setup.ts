import { execSync } from 'node:child_process'
import { Layer } from 'effect'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { NodeGoogleHealthcareFhirR4ClientLayer } from '../../src/NodeGoogleHealthcareClientLayer'
import { testConfig } from './test-config'
import { GCloudAccessToken } from '../../src/GCloudAccessToken'

/**
 * Get access token from gcloud CLI
 */
export const getGcloudToken = (): string => {
  try {
    const token = execSync('gcloud auth print-access-token', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    if (!token) {
      throw new Error('Empty token returned')
    }
    return token
  } catch {
    throw new Error(
      'Failed to get gcloud access token. Ensure you are authenticated with:\n' +
        '  gcloud auth login'
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
  Layer.provide(
    Layer.sync(GCloudAccessToken, () => ({ token: getGcloudToken() }))
  )
)

export { testConfig }
