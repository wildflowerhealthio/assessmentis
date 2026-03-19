import { Effect } from 'effect'

import { useBreadcrumbs } from '@/modules/Breadcrumbs/use-breadcrumbs'

export default function Home(): React.JSX.Element {
  useBreadcrumbs(() => [], [])

  return (
    <section>
      <h1 className="heading-6">Assessment.is</h1>
      <h2 className="heading-5">Book an Assessment</h2>
      <h2 className="heading-5">Create a Report</h2>
      <button
        onClick={() =>
          Effect.runPromise(
            Effect.sync(() => {
              console.log('Running!...')
            })
          )
        }
      >
        Load
      </button>
    </section>
  )
}
