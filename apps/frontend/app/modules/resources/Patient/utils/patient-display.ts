import { Effect } from 'effect'
import type { CurrentTimeZone } from 'effect/DateTime'

import type { Patient } from '@assessmentis/clinical-domain'

import {
  humanizeDateTimeForLocalReader,
  humanizeTimelessDate,
} from '../../../common/utils/date-utils'
import { extractReferenceId, formatHumanName } from '../../../common/utils/fhir-display'

/**
 * Get a display-friendly name for a patient
 */
function getPatientDisplayName(patient: Patient): string {
  return formatHumanName(patient.name?.[0], 'Unnamed Patient')
}

/**
 * Format patient demographics for display in DetailGrid
 */
const formatPatientDemographics = (
  patient: Patient
): Effect.Effect<{ label: string; value: string }[], never, CurrentTimeZone> =>
  Effect.gen(function* () {
    const items = [
      {
        label: 'Gender',
        value: patient.gender ?? 'Not specified',
      },
      {
        label: 'Birth Date',
        value: yield* humanizeTimelessDate(patient.birthDate, 'Not specified'),
      },
      {
        label: 'Status',
        // oxlint-disable-next-line eslint/no-ternary -- inline value in object literal
        value: patient.active === false ? 'Inactive' : 'Active',
      },
    ]

    if (patient.deceasedBoolean) {
      items.push({
        label: 'Deceased',
        value: 'Yes',
      })
    }

    if (patient.deceasedDateTime) {
      items.push({
        label: 'Deceased Date',
        value: yield* humanizeDateTimeForLocalReader(patient.deceasedDateTime),
      })
    }

    return items
  })

/**
 * Get the current practitioner ID from patient's general practitioner reference
 */
function getPatientPractitionerId(patient: Patient): string | undefined {
  return extractReferenceId(patient.generalPractitioner?.[0])
}

export { getPatientDisplayName, formatPatientDemographics, getPatientPractitionerId }
