import ObservationList from '../modules/resources/Observation/components/ObservationList'
import type { Route } from './+types/_resource.Observation._index'
import { Link, useSearchParams } from 'react-router'
import { useMemo } from 'react'
import { LoadedResult } from '@assessmentis/ontology'
import { PatientPicker } from '../modules/resources/Patient/components/PatientPicker'
import { EncounterPicker } from '../modules/resources/Encounter/components/EncounterPicker'
import { useObservationCollection } from '../modules/resources/Observation/hooks/useObservationCollection'

export async function clientLoader(_: Route.ClientLoaderArgs) {}

export default function ObservationPage(_: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const patientId = searchParams.get('patientId')
  const encounterId = searchParams.get('encounterId')

  const filter = useMemo(() => {
    const filter: {
      subject?: string
      encounter?: string
    } = {}

    if (patientId) filter.subject = `Patient/${patientId}`
    if (encounterId) {
      // For multiple encounters, use comma-separated format for FHIR search
      filter.encounter = encounterId
        .split(',')
        .map((id) => `Encounter/${id.trim()}`)
        .join(',')
    }
    return filter
  }, [patientId, encounterId])

  const { collection: observations, deleteItem: deleteObservation } =
    useObservationCollection(filter)

  const handlePatientChange = (id: string | undefined) => {
    const newParams = new URLSearchParams(searchParams)
    if (id) {
      newParams.set('patientId', id)
    } else {
      newParams.delete('patientId')
    }
    setSearchParams(newParams, { replace: false })
  }

  const handleEncounterChange = (ids: ReadonlyArray<string> | undefined) => {
    const newParams = new URLSearchParams(searchParams)
    if (ids && ids.length > 0) {
      newParams.set('encounterId', ids.join(','))
    } else {
      newParams.delete('encounterId')
    }
    setSearchParams(newParams, { replace: false })
  }

  // Parse encounter IDs from comma-separated string
  const selectedEncounterIds = encounterId
    ? encounterId.split(',').filter((id) => id.trim())
    : undefined

  return (
    <>
      <h1 className="heading-1">Observations</h1>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/Observation/new" className="button-2 blue">
          Create New Observation
        </Link>
      </div>

      <section style={{ marginTop: 'var(--space-5)' }}>
        <h2 className="heading-3">Filter Observations</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
          }}
        >
          <PatientPicker
            picking={{
              value: patientId || undefined,
              onChange: handlePatientChange,
              multiple: false,
            }}
            label="Filter by Patient"
            placeholder="All patients..."
          />
          <EncounterPicker
            picking={{
              value: selectedEncounterIds,
              onChange: handleEncounterChange,
              multiple: true,
            }}
            label="Filter by Encounters"
            placeholder="All encounters..."
          />
        </div>
      </section>

      <div style={{ marginTop: 'var(--space-5)' }}>
        {LoadedResult.handle(observations, {
          onLoading: () => <p>Loading observations...</p>,
          onError: (error) =>
            error == null ? (
              <p style={{ color: 'var(--color-error)' }}>
                Error loading observations
              </p>
            ) : (
              <p style={{ color: 'var(--color-error)' }}>
                Error loading observations: {JSON.stringify(error, null, 2)}
              </p>
            ),
          onSuccess: (observations) => (
            <ObservationList
              observations={observations}
              deleteObservation={deleteObservation}
            />
          ),
        })}
      </div>
    </>
  )
}
