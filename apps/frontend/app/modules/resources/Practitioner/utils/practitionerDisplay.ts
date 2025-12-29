import type { Practitioner } from '@assessmentis/clinical-domain/administration'

/**
 * Get a display-friendly name for a practitioner
 */
export function getPractitionerDisplayName(practitioner: Practitioner): string {
  const name = practitioner.name?.[0]
  if (!name) return 'Unnamed Practitioner'

  const given = name.given?.join(' ') ?? ''
  const family = name.family ?? ''
  return `${given} ${family}`.trim() || 'Unnamed Practitioner'
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
      value: practitioner.birthDate
        ? new Date(practitioner.birthDate).toLocaleDateString()
        : 'Not specified',
    },
    {
      label: 'Status',
      value: practitioner.active !== false ? 'Active' : 'Inactive',
    },
  ]
}
