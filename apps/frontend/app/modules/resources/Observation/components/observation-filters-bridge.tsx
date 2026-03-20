import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

import type { Observation } from '@assessmentis/clinical-domain'
import { Search } from '@assessmentis/effectful-store'

import { ObservationFilters } from './ObservationFilters/observation-filters'

export function ObservationFiltersBridge({
  onFiltersChange: handleFiltersChange,
}: {
  onFiltersChange: (filters: Search.QueryFor<typeof Observation>) => void
}): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const patientId = searchParams.get('patientId')
  const encounterId = searchParams.get('encounterId')

  useEffect(() => {
    const buildEncounterCondition = (): Search.Condition.Condition | undefined => {
      if (!encounterId) return undefined
      const encounterRefs = encounterId.split(',').map((id) => `Encounter/${id.trim()}`)
      const [first, second, ...rest] = encounterRefs
      if (first !== undefined && second !== undefined) {
        return Search.Condition.AnyOf([first, second, ...rest])
      }
      if (first !== undefined) {
        return Search.Condition.Exactly(first)
      }
      return undefined
    }

    const encounterCondition = buildEncounterCondition()
    handleFiltersChange({
      ...(patientId ? { subject: Search.Condition.Exactly(`Patient/${patientId}`) } : {}),
      ...(encounterCondition ? { encounter: encounterCondition } : {}),
    })
  }, [patientId, encounterId, handleFiltersChange])

  const handlePatientChange = (id: string | undefined): void => {
    const newParams = new URLSearchParams(searchParams)
    if (id) {
      newParams.set('patientId', id)
    } else {
      newParams.delete('patientId')
    }
    setSearchParams(newParams, { replace: false })
  }

  const handleEncounterChange = (ids: readonly string[] | undefined): void => {
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
