import { Effect } from 'effect'

import { ExternalAssertionError } from '@assessmentis/ontology'

import { LoadedGapiClient } from './loaded-gapi-client'

export type GapiHealthcareClient = typeof gapi.client.healthcare

let loaderPromise: Promise<void> | null = null

export class LoadedGapiHealthcareClient extends Effect.Service<LoadedGapiHealthcareClient>()(
  'LoadedGapiHealthcareClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const client = yield* yield* LoadedGapiClient

      return yield* Effect.tryPromise<GapiHealthcareClient, ExternalAssertionError>({
        catch(error: unknown) {
          return new ExternalAssertionError({
            expected: 'Google Healthcare API client to load without error',
            cause: error,
          })
        },
        async try() {
          if (client.healthcare) {
            return client.healthcare
          }
          loaderPromise ??= client.load(
            'https://healthcare.googleapis.com/$discovery/rest?version=v1'
          )
          await loaderPromise
          return client.healthcare
        },
      }).pipe(
        Effect.flatMap((healthcare) =>
          Effect.gen(function* () {
            if (healthcare) {
              return healthcare
            }

            const reloadedClient = yield* Effect.flatten(LoadedGapiClient)

            if (!reloadedClient.healthcare) {
              return yield* Effect.fail(
                new ExternalAssertionError({
                  expected: 'Google Healthcare API client to be present after loading',
                  cause: null,
                })
              )
            }
            return reloadedClient.healthcare
          })
        )
      )
    }),
  }
) {}
