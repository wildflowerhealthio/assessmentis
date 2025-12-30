import type { Patient } from '@assessmentis/clinical-domain/administration'
import {
  formatHumanName,
  extractReferenceId,
} from '../../../common/utils/fhirDisplay'
import { formatTimelessDate, formatUtcDateTime } from '../../../common/utils/dateUtils'

/**
 * Get a display-friendly name for a patient
 */
export function getPatientDisplayName(patient: Patient): string {
  return formatHumanName(patient.name?.[0], 'Unnamed Patient')
}

/**
 * Format patient demographics for display in DetailGrid
 */
export function formatPatientDemographics(patient: Patient) {
  const items = [
    {
      label: 'Gender',
      value: patient.gender ?? 'Not specified',
    },
    {
      label: 'Birth Date',
      value: formatTimelessDate(patient.birthDate, 'Not specified'),
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
      value: formatUtcDateTime(patient.deceasedDateTime),
    })
  }

  return items
}

/**
 * Get the current practitioner ID from patient's general practitioner reference
 */
export function getPatientPractitionerId(patient: Patient): string | undefined {
  return extractReferenceId(patient.generalPractitioner?.[0])
}
