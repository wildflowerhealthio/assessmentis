import { Effect } from 'effect'
import type { CurrentTimeZone } from 'effect/DateTime'

import type { Practitioner } from '@assessmentis/clinical-domain'

import { humanizeTimelessDate } from '../../../common/utils/date-utils'
import { formatHumanName } from '../../../common/utils/fhir-display'

/**
 * Get a display-friendly name for a practitioner
 */
export function getPractitionerDisplayName(practitioner: Practitioner): string {
  return formatHumanName(practitioner.name?.[0], 'Unnamed Practitioner')
}

/**
 * Get the practitioner's primary qualification
 */
export function getPractitionerQualification(practitioner: Practitioner): string {
  return (
    practitioner.qualification?.[0]?.code?.text ??
    practitioner.qualification?.[0]?.code?.coding?.[0]?.display ??
    'No qualification'
  )
}

/**
 * Format practitioner demographics for display in DetailGrid
 */
export const formatPractitionerDemographics = (
  practitioner: Practitioner
): Effect.Effect<{ label: string; value: string }[], never, CurrentTimeZone> =>
  Effect.gen(function* () {
    return [
      {
        label: 'Gender',
        value: practitioner.gender ?? 'Not specified',
      },
      {
        label: 'Birth Date',
        value: yield* humanizeTimelessDate(practitioner.birthDate, 'Not specified'),
      },
      {
        label: 'Status',
        // oxlint-disable-next-line eslint/no-ternary -- inline value in object literal
        value: practitioner.active === false ? 'Inactive' : 'Active',
      },
    ]
  })
