import { createContext, useContext } from 'react'
import { Chunk, Effect, ManagedRuntime, Match, Schedule, Stream } from 'effect'
import {
  ClientRuntimeContext,
  PlatformService,
} from '@assessmentis/platform-domain'
import { FirebaseWebPlatformServiceLayer } from '../../../infrastructure/firebase-web-infrastructure/src/FirebaseWebPlatformService'
import { app, auth, db } from './firebase'

export class ContextSetupError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
  }
}

export const RuntimeContext = createContext<
  ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never> | undefined
>(undefined)

export const useRuntimeContext = () => useContext(RuntimeContext)!

export const getRuntime = () => {
  console.log('Getting runtime with promise')

  return ManagedRuntime.make(FirebaseWebPlatformServiceLayer(app, auth, db))
    .runPromise(
      PlatformService.pipe(
        Effect.flatMap((platform) =>
          Stream.runCollect(
            platform.runtime.pipe(
              Stream.tap((r) =>
                Effect.sync(() => console.log('Got runtime stream value', r))
              ),
              Stream.flatMap(
                (v) =>
                  Match.value(v).pipe(
                    Match.tag('error', (e) =>
                      e.error._tag == 'NotLoggedIn'
                        ? Stream.empty
                        : Stream.fail(e)
                    ),
                    Match.tag('loading', () => Stream.empty),
                    Match.tag('loaded', (r) =>
                      Stream.succeed(ManagedRuntime.make(r.value))
                    ),
                    Match.exhaustive
                  ),
                { switch: true }
              ),
              Stream.take(1),
              Stream.retry(
                Schedule.addDelay(Schedule.recurs(15), () => '100 millis')
              )
            )
          )
        )
      )
    )
    .then(
      (
        chunk: Chunk.Chunk<
          ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>
        >
      ) => Chunk.unsafeHead(chunk)
    )
    .catch((err: unknown) => {
      console.error('Error getting runtime', { err })
      throw new Error('Error getting runtime', { cause: err })
    })
}
