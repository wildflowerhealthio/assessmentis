import type { Patient } from '@assessmentis/clinical-domain'
import { Effect } from 'effect'
import {
  formatHumanName,
  extractReferenceId,
} from '../../../common/utils/fhirDisplay'
import {
  humanizeDateTimeForLocalReader,
  humanizeTimelessDate,
} from '../../../common/utils/dateUtils'

/**
 * Get a display-friendly name for a patient
 */
export function getPatientDisplayName(patient: Patient): string {
  return formatHumanName(patient.name?.[0], 'Unnamed Patient')
}

/**
 * Format patient demographics for display in DetailGrid
 */
export const formatPatientDemographics = (patient: Patient) =>
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
        value: patient.active !== false ? 'Active' : 'Inactive',
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
export function getPatientPractitionerId(patient: Patient): string | undefined {
  return extractReferenceId(patient.generalPractitioner?.[0])
}
