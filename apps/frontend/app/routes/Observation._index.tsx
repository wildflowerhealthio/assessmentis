import type { Route } from './+types/Observation._index'
import { useSearchParams } from 'react-router'
import { useMemo } from 'react'
import { useObservationCollection } from '../modules/resources/Observation/hooks/useObservationCollection'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { ObservationListItem } from '../modules/resources/Observation/components/ObservationListItem/ObservationListItem'
import { ObservationFilters } from '../modules/resources/Observation/components/ObservationFilters/ObservationFilters'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export default function ObservationPage(_: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  useBreadcrumbs([{ label: 'Observations' }])

  const patientId = searchParams.get('patientId')
  const encounterId = searchParams.get('encounterId')

  const filter = useMemo(() => {
    const filter: {
      subject?: string
      encounter?: string
    } = {}

    if (patientId) filter.subject = `Patient/${patientId}`
    if (encounterId) {
      filter.encounter = encounterId
        .split(',')
        .map((id) => `Encounter/${id.trim()}`)
        .join(',')
    }
    return filter
  }, [patientId, encounterId])

  const { collectionPromise, deleteItem } = useObservationCollection(filter)

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

  return (
    <ResourceListPage
      title="Observations"
      collectionPromise={collectionPromise}
      createPath="/Observation/new"
      createLabel="Create New Observation"
      onDelete={deleteItem}
      ItemComponent={ObservationListItem}
      emptyMessage="No observations found. Create your first observation to get started."
      filterSlot={
        <ObservationFilters
          patientId={patientId}
          encounterId={encounterId}
          onPatientChange={handlePatientChange}
          onEncounterChange={handleEncounterChange}
        />
      }
    />
  )
}
