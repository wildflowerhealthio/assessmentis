import { Effect } from 'effect'

import { ExternalAssertionError, UnhandledError } from '@assessmentis/ontology'

export type GapiClient = typeof gapi.client

export class LoadedGapiClient extends Effect.Service<LoadedGapiClient>()(
  'LoadedGapiClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      let polls = 0
      if (typeof window == 'undefined') {
        return yield* Effect.fail(
          new UnhandledError({
            message: 'No window object available, cannot load gapi client',
          })
        )
      }

      while (!('gapi' in window) || window?.gapi == undefined) {
        console.log('Polling for gapi healthcare client availability...')
        yield* Effect.sleep('100 millis')
        polls += 1
        if (polls > 20) {
          return yield* Effect.fail(
            new UnhandledError({
              message: 'Polled for two seconds and never found gapi',
            })
          )
        }
      }
      return Effect.async<GapiClient, ExternalAssertionError>((resume) => {
        if (gapi.client) {
          return resume(Effect.succeed(gapi.client))
        }
        gapi.load('client', {
          callback: () => resume(Effect.succeed(gapi.client)),
          onerror: () =>
            resume(
              Effect.fail(
                new ExternalAssertionError({
                  expected: 'Google API client to load without error',
                  cause: new Error('gapi.load callback onerror called'),
                })
              )
            ),
          timeout: 30000,
          ontimeout: () =>
            resume(
              Effect.fail(
                new ExternalAssertionError({
                  expected: 'Google API client to load in a timeley manner',
                  cause: new Error('Timeout after 30 seconds'),
                })
              )
            ),
        })
      })
    }),
  }
) {}
