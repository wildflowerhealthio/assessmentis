import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

import type {
  Observation,
  RepositoryFilters,
} from '@assessmentis/clinical-domain'

import { ObservationFilters } from './ObservationFilters/ObservationFilters'

export function ObservationFiltersBridge({
  onFiltersChange: handleFiltersChange,
}: {
  onFiltersChange: (filters: RepositoryFilters<Observation>) => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = searchParams.get('patientId')
  const encounterId = searchParams.get('encounterId')

  useEffect(() => {
    const filter: RepositoryFilters<Observation> = {}
    if (patientId) filter.subject = `Patient/${patientId}`
    if (encounterId) {
      filter.encounter = encounterId
        .split(',')
        .map((id) => `Encounter/${id.trim()}`)
    }
    handleFiltersChange(filter)
  }, [patientId, encounterId, handleFiltersChange])

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
    <ObservationFilters
      patientId={patientId}
      encounterId={encounterId}
      onPatientChange={handlePatientChange}
      onEncounterChange={handleEncounterChange}
    />
  )
}
