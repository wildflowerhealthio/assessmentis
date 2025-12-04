import { clientAppLayer, RuntimeContext } from '../clientRuntime'
import { ManagedRuntime } from 'effect'

export const RuntimeContextOrErr = ({
  children,
}: React.PropsWithChildren<object>) => {
  const runtime = ManagedRuntime.make(clientAppLayer)
  return <RuntimeContext value={runtime}>{children}</RuntimeContext>
}
