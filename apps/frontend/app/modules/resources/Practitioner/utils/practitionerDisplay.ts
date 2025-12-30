import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import { formatHumanName } from '../../../common/utils/fhirDisplay'
import {
  formatTimelessDate,
  formatUtcDateRange,
} from '../../../common/utils/dateUtils'

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
export function formatPractitionerDemographics(practitioner: Practitioner) {
  return [
    {
      label: 'Gender',
      value: practitioner.gender ?? 'Not specified',
    },
    {
      label: 'Birth Date',
      value: formatTimelessDate(practitioner.birthDate, 'Not specified'),
    },
    {
      label: 'Status',
      value: practitioner.active !== false ? 'Active' : 'Inactive',
    },
  ]
}
