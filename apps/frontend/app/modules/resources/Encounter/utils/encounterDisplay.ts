import type { Encounter } from '@assessmentis/clinical-domain/administration'

/**
 * Get a display-friendly name for an encounter
 */
export function getEncounterDisplayName(encounter: Encounter): string {
  // Try to get a meaningful type description
  const encounterType = encounter.type?.[0]
  if (encounterType) {
    return (
      encounterType.text ?? encounterType.coding?.[0]?.display ?? 'Encounter'
    )
  }

  // Fall back to class display
  const classDisplay =
    encounter.class.display ?? encounter.class.code ?? 'Encounter'
  return classDisplay
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
  return encounter.status.charAt(0).toUpperCase() + encounter.status.slice(1)
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
