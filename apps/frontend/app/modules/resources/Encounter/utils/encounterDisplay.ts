import { Effect } from 'effect'
import type { CurrentTimeZone } from 'effect/DateTime'

import { Encounter } from '@assessmentis/clinical-domain'

import {
  humanizeDateTimeForLocalReader,
  humanizeDateTimeRangeForLocalReader,
} from '../../../common/utils/dateUtils'
import { capitalizeFirst } from '../../../common/utils/fhirDisplay'

/**
 * Get a display-friendly name for an encounter
 * Format: "January 3rd with Jane Doe" or "January 3rd, 2024 with Jane Doe"
 */
export const getEncounterDisplayName = (encounter: Encounter) =>
  Effect.gen(function* () {
    const parts: string[] = []

    // Add date if available
    if (encounter.period?.start) {
      const startDate = yield* humanizeDateTimeForLocalReader(
        encounter.period.start
      )
      parts.push(startDate)
    }

    // Add patient name if available
    if (encounter.subject?.display) {
      const patientName = encounter.subject.display
      // Remove "Patient/" prefix if present
      const cleanName = patientName.replace(/^Patient\//, '')
      parts.push(`with ${cleanName}`)
    } else {
      parts.push('Encounter')
    }

    // Return formatted string or fallback
    return parts.length > 0 ? parts.join(' ') : 'Encounter'
  })

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
export const formatEncounterDetails = (encounter: Encounter) =>
  Effect.gen(function* () {
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
      details.push({
        label: 'Period',
        value: yield* humanizeDateTimeRangeForLocalReader(encounter.period, {
          endFallback: 'Ongoing',
          startFallback: 'Not specified',
        }),
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
  })

/**
 * Format encounter period for list display
 */
export function getEncounterPeriodDisplay(
  encounter: Encounter
): Effect.Effect<string, never, CurrentTimeZone> {
  if (!encounter.period) {
    return Effect.succeed('No period specified')
  }

  return humanizeDateTimeRangeForLocalReader(encounter.period, {
    endFallback: 'Ongoing',
    neitherFallback: 'No period specified',
  })
}
