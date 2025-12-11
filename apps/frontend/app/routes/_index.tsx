import { Effect } from 'effect'
import { getRuntime, useRuntimeContext } from '../clientRuntime'
import { Route } from './+types/_index'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  await runtime.runPromise(Effect.sync(() => console.log('Pre loading...')))
}

export default function Home() {
  const runtime = useRuntimeContext()
  return (
    <section>
      <h1>Assessment.is</h1>
      <button
        onClick={() =>
          runtime.runPromise(Effect.sync(() => console.log('Running!...')))
        }
      >
        Load
      </button>
    </section>
  )
}
