import { Effect } from 'effect'
import { ExternalAssertionError } from '@assessmentis/ontology'
import { LoadedGapiClient } from './LoadedGapiClient'

export type GapiHealthcareClient = typeof gapi.client.healthcare

let loaderPromise: Promise<void> | null = null

export class LoadedGapiHealthcareClient extends Effect.Service<LoadedGapiHealthcareClient>()(
  'LoadedGapiHealthcareClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const client = yield* yield* LoadedGapiClient

      return yield* Effect.tryPromise<
        GapiHealthcareClient,
        ExternalAssertionError
      >({
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
        catch(error: unknown) {
          return new ExternalAssertionError({
            expected: 'Google Healthcare API client to load without error',
            cause: error,
          })
        },
      }).pipe(
        Effect.flatMap((healthcare) => {
          if (healthcare) return Effect.succeed(healthcare)

          return Effect.flatMap(Effect.flatten(LoadedGapiClient), (client) =>
            client.healthcare
              ? Effect.succeed(client.healthcare)
              : Effect.fail(
                  new ExternalAssertionError({
                    expected:
                      'Google Healthcare API client to be present after loading',
                    cause: null,
                  })
                )
          )
        })
      )
    }),
  }
) {}
