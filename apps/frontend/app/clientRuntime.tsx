import { createContext, useContext, useEffect, useState } from 'react'
import {
  Chunk,
  Effect,
  Exit,
  Fiber,
  ManagedRuntime,
  Match,
  Schedule,
  Stream,
} from 'effect'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import { platform } from './firebase'
import { LoadedResult } from '@assessmentis/ontology'

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

  return Effect.runPromise(
    Stream.runCollect(
      platform.runtime.changes.pipe(
        Stream.tap((r) =>
          Effect.sync(() => console.log('Got runtime stream value', r))
        ),
        Stream.flatMap(
          (v) =>
            Match.value(v).pipe(
              Match.tag('error', (e) =>
                e.error._tag == 'NotLoggedIn' ? Stream.empty : Stream.fail(e)
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
          Schedule.addDelay(Schedule.recurs(100), () => '100 millis')
        )
      )
    )
  )
    .then(
      (
        chunk: Chunk.Chunk<
          ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>
        >
      ) => {
        const runtime = Chunk.unsafeHead(chunk)
        console.log('Got runtime: ', { runtime })

        return runtime
      }
    )
    .catch((err: unknown) => {
      console.error('Error getting runtime', { err })
      throw new Error('Error getting runtime', { cause: err })
    })
}

export const useRunEffect = <A, E>(
  effect: Effect.Effect<A, E, ClientRuntimeContext>,
  deps: unknown[]
): LoadedResult<A, E | null> => {
  const [res, setRes] = useState<LoadedResult<A, E | null>>(
    LoadedResult.loading()
  )
  const runtime = useRuntimeContext()
  useEffect(() => {
    const fiber = runtime.runFork(effect)
    fiber.addObserver(
      Exit.match({
        onFailure: (e) => {
          if (e._tag === 'Fail') {
            setRes(LoadedResult.error(e.error))
          } else {
            setRes(LoadedResult.error(null))
          }
        },
        onSuccess: (a) => setRes(LoadedResult.loaded(a)),
      })
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, deps)
  return res
}
