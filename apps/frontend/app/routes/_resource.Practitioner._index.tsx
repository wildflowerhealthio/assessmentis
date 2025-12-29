import PractitionerList from '../modules/resources/Practitioner/components/PractitionerList'
import { usePractitionerCollection } from '../modules/resources/Practitioner/hooks/usePractitionerCollection'
import type { Route } from './+types/_resource.Practitioner._index'
import { Link } from 'react-router'
import { LoadedResult } from '@assessmentis/ontology'

const emptyFilters = {}

export default function PractitionerPage(_: Route.ComponentProps) {
  const { collection: practitioners, deleteItem: deletePractitioner } =
    usePractitionerCollection(emptyFilters)

  return (
    <>
      <h1 className="heading-1">Practitioners</h1>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/Practitioner/new" className="button-2 blue">
          Create New Practitioner
        </Link>
      </div>
      {LoadedResult.handle(practitioners, {
        onLoading: () => <p>Loading practitioners...</p>,
        onError: (error) => <p>Error loading practitioners: {String(error)}</p>,
        onSuccess: (practitionerList) => (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <PractitionerList
              deletePractitioner={deletePractitioner}
              practitioners={practitionerList}
            />
          </div>
        ),
      })}
    </>
  )
}
