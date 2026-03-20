import { Option, Schema } from 'effect'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

import { Encounter, type Observation, Patient } from '@assessmentis/clinical-domain'
import { Search } from '@assessmentis/effectful-store'

import { ObservationFilters } from './ObservationFilters/observation-filters'

const decodePatientUrl = Schema.decodeOption(Patient.UrlSchema)
const decodeEncounterUrl = Schema.decodeOption(Encounter.UrlSchema)

type EncounterUrl = typeof Encounter.UrlSchema.Type

const buildEncounterCondition = (
  encounterUrlParam: string | null
): Option.Option<Search.Condition.Condition<EncounterUrl>> => {
  if (!encounterUrlParam) return Option.none()
  const urlStrings = encounterUrlParam.split(',').map((s) => s.trim())
  const decodedUrls = urlStrings.flatMap((s) => Option.toArray(decodeEncounterUrl(s)))
  if (decodedUrls.length === 0) return Option.none()
  const [first, second, ...rest] = decodedUrls
  if (first !== undefined && second !== undefined) {
    return Option.some(Search.Condition.AnyOf([first, second, ...rest]))
  }
  if (first !== undefined) {
    return Option.some(Search.Condition.Exactly(first))
  }
  return Option.none()
}

export function ObservationFiltersBridge({
  onFiltersChange: handleFiltersChange,
}: {
  onFiltersChange: (filters: Search.QueryFor<typeof Observation>) => void
}): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const patientUrlParam = searchParams.get('patientUrl')
  const encounterUrlParam = searchParams.get('encounterUrl')

  useEffect(() => {
    const patientCondition = patientUrlParam
      ? Option.map(decodePatientUrl(patientUrlParam), Search.Condition.Exactly)
      : Option.none()

    const encounterCondition = buildEncounterCondition(encounterUrlParam)

    handleFiltersChange({
      ...(Option.isSome(patientCondition) ? { subject: patientCondition.value } : {}),
      ...(Option.isSome(encounterCondition) ? { encounter: encounterCondition.value } : {}),
    })
  }, [patientUrlParam, encounterUrlParam, handleFiltersChange])

  const handlePatientChange = (url: string | undefined): void => {
    const newParams = new URLSearchParams(searchParams)
    if (url) {
      newParams.set('patientUrl', url)
    } else {
      newParams.delete('patientUrl')
    }
    setSearchParams(newParams, { replace: false })
  }

  const handleEncounterChange = (urls: readonly string[] | undefined): void => {
    const newParams = new URLSearchParams(searchParams)
    if (urls && urls.length > 0) {
      newParams.set('encounterUrl', urls.join(','))
    } else {
      newParams.delete('encounterUrl')
    }
    setSearchParams(newParams, { replace: false })
  }

  return (
    <ObservationFilters
      patientUrl={patientUrlParam}
      encounterUrl={encounterUrlParam}
      onPatientChange={handlePatientChange}
      onEncounterChange={handleEncounterChange}
    />
  )
}
