import { Effect } from 'effect'
import { useRuntimeContext } from '../clientRuntime'
import { Route } from './+types/_index'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  return
}

export default function Home() {
  useBreadcrumbs([{ label: 'Home', href: '/' }])
  const runtime = useRuntimeContext()
  return (
    <section>
      <h1 className="heading-6">Assessment.is</h1>
      <h2 className="heading-5">Book an Assessment</h2>
      <h2 className="heading-5">Create a Report</h2>
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
