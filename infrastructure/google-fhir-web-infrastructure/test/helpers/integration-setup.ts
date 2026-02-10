import { Effect, Layer, pipe } from 'effect'
import {
  GoogleFhirConfig,
  LoadedGoogleFhirConfig,
} from '@assessmentis/config-domain'

import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  startGapiGoogleHealthcareClient,
} from '../../src'
import { isPromiseLike } from 'effect/Predicate'
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
    apiKey: null,
    projectId: import.meta.env.VITE_FHIR_PROJECT_ID || 'assessmentis',
    region: import.meta.env.VITE_FHIR_REGION || 'northamerica-northeast2',
    dataset: import.meta.env.VITE_FHIR_DATASET || 'integration-test',
    storeId: import.meta.env.VITE_FHIR_STORE || 'integration-store-1',
  }

  window.onerror = function (...args) {
    console.log('onerror', ...args)
  }

  const s = document.createElement('script')
  s.setAttribute('type', 'text/javascript')
  s.setAttribute('src', 'https://apis.google.com/js/api.js')
  const loaded = Promise.withResolvers<void>()

  s.onerror = (e) => {
    console.error('Error loading gapi script', e)
    loaded.reject(new Error('Error loading gapi script'))
  }
  s.onload = async () => {
    console.log('gapi script loaded', XMLHttpRequest)
    while (!('gapi' in window) || window?.gapi == undefined) {
      console.log('Polling for gapi availability...')
      await new Promise((r) => setTimeout(r, 1000))
    }

    const clientEffect = startGapiGoogleHealthcareClient.pipe(
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(LoadedGoogleFhirConfig, testConfig),
          Layer.provideMerge(
            pipe(
              Effect.gen(function* () {
                console.log('Initializing gapi healthcare client')
                const healthcare = yield* LoadedGapiHealthcareClient

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const handler1: ProxyHandler<any> = {
                  get(target, prop, receiver) {
                    const gotten = target[prop]
                    if (gotten instanceof Function) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      return function (this: unknown, ...args: any[]) {
                        const res = gotten.apply(
                          this === receiver ? target : this,
                          args
                        )
                        if (isPromiseLike(res)) {
                          res.then(
                            (r) =>
                              console.log({
                                prop: String(prop),
                                args,
                                resolved: r,
                              }),
                            (e) =>
                              console.log({
                                prop: String(prop),
                                args,
                                error: e,
                              })
                          )
                        } else {
                          console.log({
                            prop: String(prop),
                            args,
                            immediate: res,
                          })
                        }
                        return res
                      }
                    }
                    return gotten
                  },
                }
                healthcare.projects.locations.datasets.fhirStores.fhir =
                  new Proxy(
                    healthcare.projects.locations.datasets.fhirStores.fhir,
                    handler1
                  )

                return healthcare
              }),
              Effect.provide(LoadedGapiHealthcareClient.Default),
              Layer.effect(LoadedGapiHealthcareClient)
            ),
            pipe(
              LoadedGapiClient,
              Effect.flatMap((clientEffect) =>
                Effect.map(clientEffect, (client) => {
                  console.log('Setting gapi client token')
                  client.setToken({ access_token: getGcloudToken() })
                  return clientEffect
                })
              ),
              Effect.provide(LoadedGapiClient.Default),
              Layer.effect(LoadedGapiClient)
            )
          )
        )
      ),
      Effect.orDie,
      Effect.scoped
    )
    // @ts-expect-error Using window for test setup
    window['client'] = await Effect.runPromise(clientEffect).catch((e) => {
      console.error('Error initializing FHIR client', e)
      throw e
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any)['client']) {
      throw new Error('Failed to initialize FHIR client')
    }
    console.log('gapi done loading', XMLHttpRequest)

    loaded.resolve()
  }

  document.head.appendChild(s)

  await loaded.promise
}
