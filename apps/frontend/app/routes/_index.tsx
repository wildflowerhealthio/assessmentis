import { Effect } from 'effect'
import { useRuntime } from '../clientRuntime'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export default function Home() {
  useBreadcrumbs([])
  const runtime = useRuntime()
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
