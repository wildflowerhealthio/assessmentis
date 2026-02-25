import { Schema } from 'effect'

/**
 * FHIR R4 Location.status
 *
 * Indicates whether the location is still in use.
 *
 * Spec: https://hl7.org/fhir/R4/location-definitions.html#Location.status
 */
export const LocationStatus = Schema.Enums({
  active: 'active',
  suspended: 'suspended',
  inactive: 'inactive',
} as const)

export type LocationStatus = typeof LocationStatus.Type
