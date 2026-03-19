import { DateTime, Effect, Exit } from 'effect'

import { UnhandledError } from '@assessmentis/ontology'

type SyncContext = DateTime.CurrentTimeZone

export const runEffectSyncFlat = <A, E>(effect: Effect.Effect<A, E, SyncContext>): A | E =>
  Effect.runSyncExit(effect.pipe(DateTime.withCurrentZoneLocal)).pipe(
    Exit.match({
      onFailure: (e) => {
        if (e._tag === 'Fail') {
          return e.error
        }
        throw new UnhandledError({ message: 'Running effect failed', cause: e })
      },
      onSuccess: (a) => a,
    })
  )
export const runEffectSync = <A, E>(effect: Effect.Effect<A, E, SyncContext>): A =>
  Effect.runSync(effect.pipe(DateTime.withCurrentZoneLocal))
