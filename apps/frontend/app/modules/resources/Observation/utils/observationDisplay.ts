import type { DateTime } from 'effect'
import { Effect } from 'effect'

import type { Observation } from '@assessmentis/clinical-domain'
import {
  DatatypeChoice,
  type Period,
} from '@assessmentis/clinical-domain/data-types'

import {
  humanizeDateTimeForLocalReader,
  humanizeDateTimeRangeForLocalReader,
} from '../../../common/utils/dateUtils'

/**
 * Get a display-friendly name for an observation
 */
export function getObservationDisplayName(observation: Observation): string {
  return (
    observation.code.text ??
    observation.code.coding?.[0]?.display ??
    'Unknown Observation'
  )
}

/**
 * Get the observation status with proper capitalization
 */
export function getObservationStatus(observation: Observation): string {
  return (
    observation.status.charAt(0).toUpperCase() + observation.status.slice(1)
  )
}

/**
 * Get the observation category display
 */
export function getObservationCategory(observation: Observation): string {
  if (!observation.category || observation.category.length === 0) {
    return 'No category'
  }
  return observation.category
    .map((cat) => cat.text ?? cat.coding?.[0]?.display ?? 'Unknown')
    .join(', ')
}

/**
 * Format observation value as a string for display
 */
export const formatObservationValue = (
  observation: Observation | NonNullable<Observation['component']>[number]
) =>
  Effect.gen(function* () {
    const v = observation.value
    if (v) {
      return yield* DatatypeChoice.match(
        v,
        {
          Quantity: (q) => {
            const typed = q as { value?: number; unit?: string } | undefined
            return Effect.succeed(
              `${typed?.value ?? ''} ${typed?.unit ?? ''}`.trim()
            )
          },
          string: (s) => Effect.succeed(s),
          integer: (n) => Effect.succeed(n.toString()),
          Ratio: (r) => Effect.succeed(String(r)),
          CodeableConcept: (cc) => {
            const typed = cc as
              | {
                  text?: string
                  coding?: Array<{ display?: string }>
                }
              | undefined
            return Effect.succeed(
              typed?.text ?? typed?.coding?.[0]?.display ?? 'Coded value'
            )
          },
          boolean: (b) => Effect.succeed(b ? 'Yes' : 'No'),
          dateTime: (dt) => humanizeDateTimeForLocalReader(dt),
          time: (t) => Effect.succeed(t),
        },
        () => Effect.succeed('See details')
      )
    }

    if (observation.dataAbsentReason) {
      return `Data absent: ${observation.dataAbsentReason.text ?? 'Unknown reason'}`
    }

    return 'See details'
  })

/**
 * Get effective date display for observation
 */
export const getObservationEffectiveDate = (observation: Observation) =>
  Effect.gen(function* () {
    if (!observation.effective) return 'Unknown date'

    return yield* DatatypeChoice.match(
      observation.effective,
      {
        dateTime: (dt) => humanizeDateTimeForLocalReader(dt),
        Period: (p) =>
          humanizeDateTimeRangeForLocalReader(p as Period | undefined, {
            endFallback: 'Ongoing',
            neitherFallback: 'Unknown date',
          }),
        instant: (i) => humanizeDateTimeForLocalReader(i as DateTime.Utc),
      },
      () => Effect.succeed('Unknown date')
    )
  })

/**
 * Format observation details for display in DetailGrid
 */
export const formatObservationDetails = (observation: Observation) =>
  Effect.gen(function* () {
    const details: { label: string; value: string }[] = [
      {
        label: 'Status',
        value: getObservationStatus(observation),
      },
      {
        label: 'Category',
        value: getObservationCategory(observation),
      },
      {
        label: 'Effective Date',
        value: yield* getObservationEffectiveDate(observation),
      },
    ]

    if (observation.issued) {
      details.push({
        label: 'Issued',
        value: yield* humanizeDateTimeForLocalReader(observation.issued),
      })
    }

    if (observation.subject) {
      details.push({
        label: 'Subject',
        value:
          observation.subject.display ??
          observation.subject.reference ??
          'Not specified',
      })
    }

    if (observation.encounter) {
      details.push({
        label: 'Encounter',
        value:
          observation.encounter.display ??
          observation.encounter.reference ??
          'Not specified',
      })
    }

    if (observation.performer && observation.performer.length > 0) {
      details.push({
        label: 'Performer(s)',
        value: observation.performer
          .map((p) => p.display ?? p.reference ?? 'Unknown')
          .join(', '),
      })
    }

    return details
  })
