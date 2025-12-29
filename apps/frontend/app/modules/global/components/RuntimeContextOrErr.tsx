import { useEffect, useState } from 'react'
import {
  ContextError,
  LoadedRuntimeContext,
  RuntimeContext,
  useLoadedRuntimeContext,
} from '../../../clientRuntime'
import { Effect, ManagedRuntime, Stream } from 'effect'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import { LoadedResult } from '@assessmentis/ontology'
import { pipe } from 'effect'
import { platform } from '../../../firebase'

export const LoadedRuntimeContextProvider = ({
  children,
}: React.PropsWithChildren<object>) => {
  const [runtime, setRuntime] = useState<
    LoadedResult<
      ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
      ContextError
    >
  >(LoadedResult.loading())

  useEffect(() => {
    console.log('Getting runtime Effect')

    const abort = new AbortController()

    Effect.runPromise(
      platform.runtime.changes.pipe(
        Stream.runForEach((r) =>
          Effect.sync(() => {
            console.log('Setting runtime', r)
            setRuntime(
              pipe(
                r,
                LoadedResult.map((layer) => ManagedRuntime.make(layer))
              )
            )
          })
        )
      ),
      { signal: abort.signal }
    )
      .then(() => {
        console.log('Finished getting runtime Effect')
      })
      .catch((e) => {
        console.error('Error getting runtime Effect', e)
        setRuntime(LoadedResult.error(e))
      })

    return () => {
      abort.abort()
    }
  }, [])

  return (
    <LoadedRuntimeContext.Provider value={runtime}>
      {children}
    </LoadedRuntimeContext.Provider>
  )
}

export const RuntimeContextOrErr = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string | undefined }>) => {
  const runtime = useLoadedRuntimeContext()
  if (runtime._tag === 'loading') {
    return <div className={className}>Loading...</div>
  }

  if (runtime._tag === 'error') {
    throw runtime.error
  }

  return (
    <RuntimeContext value={runtime.value}>
      <div className={className}>{children}</div>
    </RuntimeContext>
  )
}
