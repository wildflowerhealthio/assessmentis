import { Match, Option, Predicate, Schema } from 'effect'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

import { Encounter, type Observation, Patient } from '@assessmentis/clinical-domain'
import { Search } from '@assessmentis/effectful-store'

import { ObservationFilters } from './ObservationFilters/observation-filters'

const decodePatientUrl = Schema.decodeOption(Patient.UrlSchema)
const decodeEncounterUrl = Schema.decodeOption(Encounter.UrlSchema)

type EncounterUrl = typeof Encounter.UrlSchema.Type

/**
 * Parses a comma-separated URL string into a typed search {@link Search.Condition.Condition}.
 * Returns `Exactly` for a single valid URL, `AnyOf` for multiple, or `None` if
 * the input is empty or contains no decodable encounter URLs.
 */
const buildEncounterCondition = (
  encounterUrlParam: string | null
): Option.Option<Search.Condition.Condition<EncounterUrl>> => {
  if (!encounterUrlParam) return Option.none()
  const urlStrings = encounterUrlParam.split(',').map((s) => s.trim())
  const decodedUrls = urlStrings.flatMap((s) => Option.toArray(decodeEncounterUrl(s)))

  return Match.value<EncounterUrl[]>(decodedUrls).pipe(
    Match.withReturnType<Option.Option<Search.Condition.Condition<EncounterUrl>>>(),
    Match.when(
      (arr: EncounterUrl[]) => Predicate.isTupleOfAtLeast(2)(arr),
      // oxlint-disable-next-line unicorn/no-array-callback-reference
      (urls) => Option.some(Search.Condition.AnyOf(urls))
    ),
    Match.when(
      (arr: EncounterUrl[]) => Predicate.isTupleOf(1)(arr),
      // oxlint-disable-next-line unicorn/no-array-callback-reference
      ([url]) => Option.some(Search.Condition.Exactly(url))
    ),
    Match.orElse(() => Option.none())
  )
}

/**
 * Bridges URL search params (`patientUrl`, `encounterUrl`) to typed
 * {@link Search.Condition.Condition} filters for Observation queries.
 * Reads from and writes to the browser URL via `useSearchParams`.
 */
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
      ? // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Option.map is not an iterator method
        Option.map(decodePatientUrl(patientUrlParam), Search.Condition.Exactly)
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
