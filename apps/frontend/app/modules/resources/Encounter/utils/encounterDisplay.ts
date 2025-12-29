import type { Encounter } from '@assessmentis/clinical-domain/administration'
import { capitalizeFirst } from '../../../common/utils/fhirDisplay'

/**
 * Get a display-friendly name for an encounter
 * Format: "January 3rd with Jane Doe" or "January 3rd, 2024 with Jane Doe"
 */
export function getEncounterDisplayName(encounter: Encounter): string {
  const parts: string[] = []

  // Add date if available
  if (encounter.period?.start) {
    const date = new Date(encounter.period.start.epochMillis)

    // Validate that the date is valid
    if (!isNaN(date.getTime())) {
      const now = new Date()

      // Calculate if date is within 3 months before or after today
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(now.getMonth() - 3)
      const threeMonthsFromNow = new Date(now)
      threeMonthsFromNow.setMonth(now.getMonth() + 3)

      const isWithinThreeMonths =
        date >= threeMonthsAgo && date <= threeMonthsFromNow

      // Format date
      const month = date.toLocaleString('en-US', { month: 'long' })
      const day = date.getDate()
      const daySuffix = getDaySuffix(day)
      const year = date.getFullYear()

      if (isWithinThreeMonths) {
        parts.push(`${month} ${day}${daySuffix}`)
      } else {
        parts.push(`${month} ${day}${daySuffix}, ${year}`)
      }
    }
  }

  // Add patient name if available
  if (encounter.subject?.display) {
    const patientName = encounter.subject.display
    // Remove "Patient/" prefix if present
    const cleanName = patientName.replace(/^Patient\//, '')
    parts.push(`with ${cleanName}`)
  }

  // Return formatted string or fallback
  return parts.length > 0 ? parts.join(' ') : 'Encounter'
}

/**
 * Get the ordinal suffix for a day (st, nd, rd, th)
 */
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Get the encounter class display text
 */
export function getEncounterClass(encounter: Encounter): string {
  return encounter.class.display ?? encounter.class.code ?? 'Unknown class'
}

/**
 * Get the encounter status with proper capitalization
 */
export function getEncounterStatus(encounter: Encounter): string {
  return capitalizeFirst(encounter.status)
}

/**
 * Format encounter details for display in DetailGrid
 */
export function formatEncounterDetails(encounter: Encounter) {
  const details = [
    {
      label: 'Status',
      value: getEncounterStatus(encounter),
    },
    {
      label: 'Class',
      value: getEncounterClass(encounter),
    },
  ]

  if (encounter.type && encounter.type.length > 0) {
    details.push({
      label: 'Type',
      value: encounter.type
        .map((t) => t.text ?? t.coding?.[0]?.display ?? 'Unknown')
        .join(', '),
    })
  }

  if (encounter.period) {
    const start = encounter.period.start
      ? new Date(encounter.period.start.epochMillis).toLocaleString()
      : 'Not specified'
    const end = encounter.period.end
      ? new Date(encounter.period.end.epochMillis).toLocaleString()
      : 'Ongoing'

    details.push({
      label: 'Period',
      value: `${start} - ${end}`,
    })
  }

  if (encounter.subject) {
    details.push({
      label: 'Subject',
      value:
        encounter.subject.display ??
        encounter.subject.reference ??
        'Not specified',
    })
  }

  if (encounter.serviceType) {
    details.push({
      label: 'Service Type',
      value:
        encounter.serviceType.text ??
        encounter.serviceType.coding?.[0]?.display ??
        'Not specified',
    })
  }

  if (encounter.priority) {
    details.push({
      label: 'Priority',
      value:
        encounter.priority.text ??
        encounter.priority.coding?.[0]?.display ??
        'Not specified',
    })
  }

  return details
}

/**
 * Format encounter period for list display
 */
export function getEncounterPeriodDisplay(encounter: Encounter): string {
  if (!encounter.period) {
    return 'No period specified'
  }

  if (encounter.period.start) {
    const startDate = new Date(
      encounter.period.start.epochMillis
    ).toLocaleDateString()
    if (encounter.period.end) {
      const endDate = new Date(
        encounter.period.end.epochMillis
      ).toLocaleDateString()
      return `${startDate} - ${endDate}`
    }
    return `${startDate} - Ongoing`
  }

  return 'No period specified'
}
