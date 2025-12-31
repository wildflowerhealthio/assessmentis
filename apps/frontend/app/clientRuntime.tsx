import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Chunk,
  DateTime,
  Effect,
  Exit,
  Fiber,
  ManagedRuntime,
  Match,
  Schedule,
  Stream,
} from 'effect'
import { ClientRuntimeContext, OrgError } from '@assessmentis/platform-domain'
import { platform } from './firebase'
import {
  ExternalAssertionError,
  LoadedResult,
  NeedsAuthenticationError,
  UnhandledError,
} from '@assessmentis/ontology'

export class ContextSetupError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
  }
}

export const useRuntime = () => {
  const loadedRuntime = useLoadedRuntimeContext()
  const effectQueueRef = useRef<
    {
      runner: (
        runtime: ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>
      ) => void
      reject: (reason?: unknown) => void
    }[]
  >([])

  useEffect(() => {
    if (effectQueueRef.current.length > 0) {
      if (loadedRuntime._tag == 'loaded') {
        const runtime = loadedRuntime.value
        const currentQueue = effectQueueRef.current
        effectQueueRef.current = []
        currentQueue.forEach(({ runner }) => {
          runner(runtime)
        })
      } else if (loadedRuntime._tag == 'error') {
        const currentQueue = effectQueueRef.current
        effectQueueRef.current = []
        currentQueue.forEach(({ reject }) => {
          reject(loadedRuntime.error)
        })
      }
    }
  }, [loadedRuntime])

  const partialRuntime = useMemo(() => {
    if (loadedRuntime._tag == 'loading')
      return {
        runPromise: <A, E>(effect: Effect.Effect<A, E, ClientRuntimeContext>) =>
          new Promise<A>((resolve, reject) => {
            const runner = (
              runtime: ManagedRuntime.ManagedRuntime<
                ClientRuntimeContext,
                never
              >
            ) => runtime.runPromise(effect).then(resolve).catch(reject)
            effectQueueRef.current.push({ runner, reject })
          }),
      }
    else if (loadedRuntime._tag == 'error') {
      throw loadedRuntime.error
    }
    return loadedRuntime.value
  }, [loadedRuntime])

  return partialRuntime
}

export type ContextError = OrgError

export const LoadedRuntimeContext = createContext<
  | LoadedResult<
      ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
      ContextError
    >
  | undefined
>(undefined)

export const useLoadedRuntimeContext = () => useContext(LoadedRuntimeContext)!

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
  effect: Effect.Effect<A, E, ClientRuntimeContext>
): LoadedResult<A, E | ContextError> => {
  const [res, setRes] = useState<LoadedResult<A, E | ContextError>>(
    LoadedResult.loading()
  )
  const loadedRuntime = useLoadedRuntimeContext()

  useEffect(() => {
    if (loadedRuntime._tag != 'loaded') {
      return
    }

    const runtime = loadedRuntime.value
    const fiber = runtime.runFork(effect)
    fiber.addObserver(
      Exit.match({
        onFailure: (e) => {
          if (e._tag === 'Fail') {
            setRes(LoadedResult.error(e.error))
          }
        },
        onSuccess: (a) => setRes(LoadedResult.loaded(a)),
      })
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [loadedRuntime, effect])

  if (loadedRuntime._tag != 'loaded') {
    return loadedRuntime
  }
  return res
}

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
        throw new UnhandledError({ cause: e })
      },
      onSuccess: (a) => a,
    })
  )
}

export const useResourceRunEffect = <A, E>(
  effect: Effect.Effect<A, E, ClientRuntimeContext>
): LoadedResult<
  A,
  Exclude<
    E,
    | UnhandledError
    | ContextError
    | ExternalAssertionError
    | NeedsAuthenticationError
  >
> => {
  const loaded = useRunEffect(
    useMemo(
      () =>
        effect.pipe(
          Effect.mapError(
            (
              error
            ): Exclude<
              E,
              | UnhandledError
              | ContextError
              | ExternalAssertionError
              | NeedsAuthenticationError
            > => {
              if (error instanceof UnhandledError) throw error
              if (error instanceof ExternalAssertionError) throw error
              if (error instanceof NeedsAuthenticationError) throw error
              if (
                typeof error === 'object' &&
                error !== null &&
                '_tag' in error
              ) {
                if (
                  error._tag == 'OrgDataError' ||
                  error._tag == 'UserDataError' ||
                  error._tag == 'AuthStateError' ||
                  error._tag == 'NotLoggedIn'
                ) {
                  throw error
                }
              }

              return error as Exclude<
                E,
                | UnhandledError
                | ContextError
                | ExternalAssertionError
                | NeedsAuthenticationError
              >
            }
          )
        ),
      [effect]
    )
  )
  return useMemo(() => {
    if (loaded._tag == 'error') {
      const error = loaded.error
      if (typeof error === 'object' && error !== null && '_tag' in error) {
        if (
          error._tag == 'OrgDataError' ||
          error._tag == 'UserDataError' ||
          error._tag == 'AuthStateError' ||
          error._tag == 'NotLoggedIn'
        ) {
          throw error
        }
      }
      return LoadedResult.error(error)
    }

    return loaded
  }, [loaded])
}
