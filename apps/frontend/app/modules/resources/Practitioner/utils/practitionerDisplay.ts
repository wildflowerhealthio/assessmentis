import { Effect } from 'effect'

import type { Practitioner } from '@assessmentis/clinical-domain'

import { humanizeTimelessDate } from '../../../common/utils/dateUtils'
import { formatHumanName } from '../../../common/utils/fhirDisplay'

/**
 * Get a display-friendly name for a practitioner
 */
export function getPractitionerDisplayName(practitioner: Practitioner): string {
  return formatHumanName(practitioner.name?.[0], 'Unnamed Practitioner')
}

/**
 * Get the practitioner's primary qualification
 */
export function getPractitionerQualification(
  practitioner: Practitioner
): string {
  return (
    practitioner.qualification?.[0]?.code?.text ??
    practitioner.qualification?.[0]?.code?.coding?.[0]?.display ??
    'No qualification'
  )
}

/**
 * Format practitioner demographics for display in DetailGrid
 */
export const formatPractitionerDemographics = (practitioner: Practitioner) =>
  Effect.gen(function* () {
    return [
      {
        label: 'Gender',
        value: practitioner.gender ?? 'Not specified',
      },
      {
        label: 'Birth Date',
        value: yield* humanizeTimelessDate(
          practitioner.birthDate,
          'Not specified'
        ),
      },
      {
        label: 'Status',
        value: practitioner.active !== false ? 'Active' : 'Inactive',
      },
    ]
  })
