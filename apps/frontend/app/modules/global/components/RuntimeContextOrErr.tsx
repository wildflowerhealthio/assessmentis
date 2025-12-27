import { useEffect, useState } from 'react'
import { RuntimeContext } from '../../../clientRuntime'
import { Effect, ManagedRuntime, Stream } from 'effect'
import { ClientRuntimeContext, OrgError } from '@assessmentis/platform-domain'
import { LoadedResult } from '@assessmentis/ontology'
import { pipe } from 'effect'
import { platform } from '../../../firebase'

export const RuntimeContextOrErr = ({
  children,
}: React.PropsWithChildren<object>) => {
  const [runtime, setRuntime] = useState<
    LoadedResult<
      ManagedRuntime.ManagedRuntime<ClientRuntimeContext, never>,
      OrgError
    >
  >(LoadedResult.loading())

  useEffect(() => {
    console.log('Getting runtime Effect')

    const abort = new AbortController()

    Effect.runPromise(
      platform.runtime.changes.pipe(
        Stream.runForEach((r) =>
          Effect.sync(() => {
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

  if (runtime._tag === 'loading') {
    return (
      <>
        <div>Loading...</div>
        {children}
      </>
    )
  }

  if (runtime._tag === 'error') {
    return (
      <>
        <div>
          Runtime Context Loading Error: {JSON.stringify(runtime.error)}
        </div>

        {children}
      </>
    )
  }

  return <RuntimeContext value={runtime.value}>{children}</RuntimeContext>
}
