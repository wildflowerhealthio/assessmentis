import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import { formatHumanName, formatDate } from '../../../common/utils/fhirDisplay'

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
 * Format a date range from epoch milliseconds
 * @param startEpochMillis - Start date in epoch milliseconds
 * @param endEpochMillis - End date in epoch milliseconds (optional)
 * @returns Formatted date range string (e.g., "1/1/2020 - 12/31/2024" or "1/1/2020 - Present")
 */
export function formatDateRange(
  startEpochMillis: number | undefined,
  endEpochMillis: number | undefined
): string {
  const startStr = startEpochMillis
    ? new Date(startEpochMillis).toLocaleDateString()
    : 'Unknown'
  const endStr = endEpochMillis
    ? new Date(endEpochMillis).toLocaleDateString()
    : 'Present'
  return `${startStr} - ${endStr}`
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
      value: formatDate(practitioner.birthDate, 'Not specified'),
    },
    {
      label: 'Status',
      value: practitioner.active !== false ? 'Active' : 'Inactive',
    },
  ]
}
