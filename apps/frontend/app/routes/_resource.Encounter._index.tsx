import EncountersList from '../modules/resources/Encounter/components/EncountersList'
import { useEncounterCollection } from '../modules/resources/Encounter/hooks/useEncounterCollection'
import type { Route } from './+types/_resource.Encounter._index'
import { Link } from 'react-router'
import { LoadedResult } from '@assessmentis/ontology'

const emptyFilters = {}

export default function EncounterPage(_: Route.ComponentProps) {
  const { collection: encounters, deleteItem: deleteEncounter } =
    useEncounterCollection(emptyFilters)

  return (
    <>
      <h1 className="heading-1">Encounters</h1>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/Encounter/new" className="button-2 blue">
          Create New Encounter
        </Link>
      </div>
      {LoadedResult.handle(encounters, {
        onLoading: () => <p>Loading encounters...</p>,
        onError: (error) => <p>Error loading encounters: {String(error)}</p>,
        onSuccess: (encounterList) => (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <EncountersList
              deleteEncounter={deleteEncounter}
              encounters={encounterList}
            />
          </div>
        ),
      })}
    </>
  )
}
