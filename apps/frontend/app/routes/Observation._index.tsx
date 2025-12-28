import { Effect } from 'effect'
import {
  Observation,
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { useRunEffect } from '../clientRuntime'
import ObservationList from '../modules/observation/components/ObservationList'
import type { Route } from './+types/Observation._index'
import {
  PatientPicker,
  EncounterPicker,
} from 'app/modules/common/components/BasePicker'
import { useSearchParams } from 'react-router'
import { useMemo } from 'react'
import { LoadedResult } from '@assessmentis/ontology'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'

export async function clientLoader(_: Route.ClientLoaderArgs) {}

const useObservations = (initial: ReadonlyArray<Observation>) => {
  return useClinicalDataCollection<
    ObservationId,
    Observation,
    ObservationRepository,
    typeof ObservationRepository
  >(ObservationRepository, initial)
}

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

  const remoteObservations = useRunEffect(
    useMemo(() => {
      return Effect.gen(function* () {
        const observationRepository = yield* ObservationRepository
        const observations = yield* observationRepository.getMany(filter)
        return observations
      })
    }, [filter])
  )

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
        {LoadedResult.handle(remoteObservations, {
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
            <EditableObservationList observations={observations} />
          ),
        })}
      </div>
    </>
  )
}

const EditableObservationList = ({
  observations: initialObservations,
}: {
  observations: ReadonlyArray<Observation>
}) => {
  const { collection: observations, deleteItem: deleteObservation } =
    useObservations(initialObservations)
  return (
    <ObservationList
      observations={observations}
      deleteObservation={deleteObservation}
    />
  )
}
