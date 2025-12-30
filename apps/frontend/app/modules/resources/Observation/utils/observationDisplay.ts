import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  formatDateTime,
  formatDate,
  formatDateRange,
} from '../../../common/utils/fhirDisplay'

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
export function formatObservationValue(
  observation: Observation | NonNullable<Observation['component']>[number]
): string {
  if ('valueQuantity' in observation && observation.valueQuantity) {
    const val = observation.valueQuantity.value ?? ''
    const unit = observation.valueQuantity.unit ?? ''
    return `${val} ${unit}`.trim()
  }

  if ('valueString' in observation && observation.valueString) {
    return observation.valueString
  }

  if ('valueInteger' in observation && observation.valueInteger !== undefined) {
    return observation.valueInteger.toString()
  }

  if ('valueDecimal' in observation && observation.valueDecimal !== undefined) {
    return observation.valueDecimal.toString()
  }

  if (
    'valueCodeableConcept' in observation &&
    observation.valueCodeableConcept
  ) {
    return (
      observation.valueCodeableConcept.text ??
      observation.valueCodeableConcept.coding?.[0]?.display ??
      'Coded value'
    )
  }

  if ('valueBoolean' in observation && observation.valueBoolean !== undefined) {
    return observation.valueBoolean ? 'Yes' : 'No'
  }

  if ('valueDateTime' in observation && observation.valueDateTime) {
    return formatDateTime(observation.valueDateTime)
  }

  if ('valueDate' in observation && observation.valueDate) {
    return observation.valueDate
  }

  if ('valueTime' in observation && observation.valueTime) {
    return observation.valueTime
  }

  if ('valueCoding' in observation && observation.valueCoding) {
    return (
      observation.valueCoding.display ??
      observation.valueCoding.code ??
      'Coded value'
    )
  }

  if ('valueCode' in observation && observation.valueCode) {
    return observation.valueCode
  }

  if ('valueReference' in observation && observation.valueReference) {
    return (
      observation.valueReference.display ??
      observation.valueReference.reference ??
      'Reference'
    )
  }

  if ('dataAbsentReason' in observation && observation.dataAbsentReason) {
    return `Data absent: ${observation.dataAbsentReason.text ?? 'Unknown reason'}`
  }

  return 'See details'
}

/**
 * Get effective date display for observation
 */
export function getObservationEffectiveDate(observation: Observation): string {
  if (observation.effectiveDateTime) {
    return formatDate(observation.effectiveDateTime)
  }

  if (observation.effectivePeriod) {
    return formatDateRange(
      observation.effectivePeriod.start,
      observation.effectivePeriod.end,
      'Ongoing',
      'Unknown date'
    )
  }

  if (observation.effectiveInstant) {
    return formatDate(observation.effectiveInstant)
  }

  return 'Unknown date'
}

/**
 * Format observation details for display in DetailGrid
 */
export function formatObservationDetails(observation: Observation) {
  const details = [
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
      value: getObservationEffectiveDate(observation),
    },
  ]

  if (observation.issued) {
    details.push({
      label: 'Issued',
      value: formatDateTime(observation.issued),
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
}
