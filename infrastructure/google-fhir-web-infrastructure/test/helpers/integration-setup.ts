import { Effect, Layer } from 'effect'

import type { GoogleFhirConfig } from '@assessmentis/config-domain'

import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  makeGapiGoogleHealthcareClient,
} from '../../src'

/**
 * Get access token from gcloud CLI
 */
export const getGcloudToken = (): string => {
  const token = import.meta.env.VITE_GCLOUD_TOKEN
  if (!token) {
    throw new Error(
      'Failed to get gcloud access token. Ensure you are authenticated with:\n' +
        'gcloud auth login'
    )
  }
  return token
}

/**
 * Verify that gcloud auth is configured
 */
export const verifyGcloudAuth = (): void => {
  getGcloudToken()
}

// Setup hooks for MSW
export const setupClientOnWindow = async () => {
  console.log('Setting up MSW and Google FHIR client for tests')

  const testConfig: GoogleFhirConfig = {
    _tag: 'google_fhir_store' as const,
    dataset: import.meta.env.VITE_FHIR_DATASET ?? 'integration-test',
    projectId: import.meta.env.VITE_FHIR_PROJECT_ID ?? 'assessmentis',
    region: import.meta.env.VITE_FHIR_REGION ?? 'northamerica-northeast2',
    storeId: import.meta.env.VITE_FHIR_STORE ?? 'integration-store-1',
  }

  window.addEventListener('error', function setupClientOnWindow(...args) {
    console.log('onerror', ...args)
  })

  const s = document.createElement('script')
  s.setAttribute('type', 'text/javascript')
  s.setAttribute('src', 'https://apis.google.com/js/api.js')
  const loaded = Promise.withResolvers<void>()

  s.addEventListener('error', (e) => {
    console.error('Error loading gapi script', e)
    loaded.reject(new Error('Error loading gapi script'))
  })
  s.addEventListener('load', async () => {
    console.log('gapi script loaded', XMLHttpRequest)
    while (!('gapi' in window) || window?.gapi === undefined) {
      console.log('Polling for gapi availability...')
      await new Promise((r) => {
        setTimeout(r, 1000)
      })
    }
    const resolveGapiEffect = Effect.gen(function* resolveGapiEffect() {
      const gapiClientEffect = yield* LoadedGapiClient
      const gapiClient = yield* gapiClientEffect
      console.log('Setting gapi client token')
      gapiClient.setToken({ access_token: getGcloudToken() })

      console.log('Initializing gapi healthcare client')
      const healthcare = yield* LoadedGapiHealthcareClient

      return makeGapiGoogleHealthcareClient({
        config: testConfig,
        gapiClient,
        getAccessToken: Effect.succeed(getGcloudToken()),
        healthcare,
      })
    }).pipe(
      Effect.provide(
        Layer.provideMerge(LoadedGapiHealthcareClient.Default, LoadedGapiClient.Default)
      ),
      Effect.orDie
    )
    // @ts-expect-error Using window for test setup
    window['client'] = await Effect.runPromise(resolveGapiEffect).catch((error) => {
      console.error('Error initializing FHIR client', error)
      throw error
    })
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion typescript/no-explicit-any
    if (!(window as any)['client']) {
      throw new Error('Failed to initialize FHIR client')
    }
    console.log('gapi done loading', XMLHttpRequest)

    loaded.resolve()
  })

  document.head.append(s)

  await loaded.promise
}
