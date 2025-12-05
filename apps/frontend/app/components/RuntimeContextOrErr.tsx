import { useEffect, useState } from 'react'
import { ClientRuntimeContext, RuntimeContext } from '../clientRuntime'
import { ManagedRuntime } from 'effect'
import { subscribeToRuntime } from '../firebase'

export const RuntimeContextOrErr = ({
  children,
}: React.PropsWithChildren<object>) => {
  const [runtime, setRuntime] = useState<ManagedRuntime.ManagedRuntime<
    ClientRuntimeContext,
    never
  > | null>(null)

  useEffect(() => subscribeToRuntime(setRuntime), [])

  if (runtime === null) {
    return <div>Loading...</div>
  }

  return <RuntimeContext value={runtime}>{children}</RuntimeContext>
}
