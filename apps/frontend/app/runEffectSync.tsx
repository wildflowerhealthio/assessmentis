import { DateTime, Effect, Exit } from 'effect'
import { OrgError } from '@assessmentis/platform-domain'
import { UnhandledError } from '@assessmentis/ontology'

export type ContextError = OrgError

type SyncContext = DateTime.CurrentTimeZone

export const runEffectSync = <A, E>(
  effect: Effect.Effect<A, E, SyncContext>
): A | E => {
  return Effect.runSyncExit(effect.pipe(DateTime.withCurrentZoneLocal)).pipe(
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
}
