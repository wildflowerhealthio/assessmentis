import { Effect } from 'effect'
import type { CurrentTimeZone } from 'effect/DateTime'

import type { Observation } from '@assessmentis/clinical-domain'
import {
  CodeableConcept,
  DatatypeChoice,
  Period,
  Quantity,
} from '@assessmentis/clinical-domain/data-types'

import {
  humanizeDateTimeForLocalReader,
  humanizeDateTimeRangeForLocalReader,
} from '../../../common/utils/date-utils'

/**
 * Get a display-friendly name for an observation
 */
export function getObservationDisplayName(observation: Observation): string {
  return observation.code.text ?? observation.code.coding?.[0]?.display ?? 'Unknown Observation'
}

/**
 * Get the observation status with proper capitalization
 */
export function getObservationStatus(observation: Observation): string {
  return observation.status.charAt(0).toUpperCase() + observation.status.slice(1)
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
): Effect.Effect<string, never, CurrentTimeZone> =>
  Effect.gen(function* () {
    const v = observation.value
    if (v) {
      return yield* DatatypeChoice.match(
        v,
        {
          CodeableConcept: () => {
            const cc = CodeableConcept.Datatype.from(v)
            return Effect.succeed(cc?.text ?? cc?.coding?.[0]?.display ?? 'Coded value')
          },
          Quantity: () => {
            const q = Quantity.Datatype.from(v)
            return Effect.succeed(`${q?.value ?? ''} ${q?.unit ?? ''}`.trim())
          },
          Ratio: (r) => Effect.succeed(String(r)),
          boolean: (b) => {
            if (b) {
              return Effect.succeed('Yes')
            }
            return Effect.succeed('No')
          },
          dateTime: (dt) => humanizeDateTimeForLocalReader(dt),
          integer: (n) => Effect.succeed(n.toString()),
          string: (s) => Effect.succeed(s),
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
export const getObservationEffectiveDate = (
  observation: Observation
): Effect.Effect<string, never, CurrentTimeZone> =>
  Effect.gen(function* () {
    if (!observation.effective) {
      return 'Unknown date'
    }

    return yield* DatatypeChoice.match(
      observation.effective,
      {
        Period: (_) =>
          humanizeDateTimeRangeForLocalReader(Period.Datatype.from(observation.effective), {
            endFallback: 'Ongoing',
            neitherFallback: 'Unknown date',
          }),
        dateTime: (dt) => humanizeDateTimeForLocalReader(dt),
        instant: (inst) => Effect.succeed(String(inst)),
      },
      () => Effect.succeed('Unknown date')
    )
  })

/**
 * Format observation details for display in DetailGrid
 */
export const formatObservationDetails = (
  observation: Observation
): Effect.Effect<{ label: string; value: string }[], never, CurrentTimeZone> =>
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
        value: observation.subject.display ?? observation.subject.reference ?? 'Not specified',
      })
    }

    if (observation.encounter) {
      details.push({
        label: 'Encounter',
        value: observation.encounter.display ?? observation.encounter.reference ?? 'Not specified',
      })
    }

    if (observation.performer && observation.performer.length > 0) {
      details.push({
        label: 'Performer(s)',
        value: observation.performer.map((p) => p.display ?? p.reference ?? 'Unknown').join(', '),
      })
    }

    return details
  })
