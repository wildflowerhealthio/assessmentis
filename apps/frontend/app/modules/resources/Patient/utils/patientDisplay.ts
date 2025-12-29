import type { Patient } from '@assessmentis/clinical-domain/administration'

/**
 * Get a display-friendly name for a patient
 */
export function getPatientDisplayName(patient: Patient): string {
  const name = patient.name?.[0]
  if (!name) return 'Unnamed Patient'

  const given = name.given?.join(' ') ?? ''
  const family = name.family ?? ''
  return `${given} ${family}`.trim() || 'Unnamed Patient'
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
      value: patient.birthDate
        ? new Date(patient.birthDate).toLocaleDateString()
        : 'Not specified',
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
      value: new Date(patient.deceasedDateTime.epochMillis).toLocaleString(),
    })
  }

  return items
}

/**
 * Get the current practitioner ID from patient's general practitioner reference
 */
export function getPatientPractitionerId(patient: Patient): string | undefined {
  return patient.generalPractitioner?.[0]?.reference?.split('/')[1]
}
