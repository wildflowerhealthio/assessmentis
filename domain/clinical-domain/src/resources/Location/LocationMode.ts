import { Schema } from 'effect'

/**
 * FHIR R4 Location.mode
 *
 * Indicates whether a resource instance represents a specific location or a class of locations.
 *
 * Spec: https://hl7.org/fhir/R4/location-definitions.html#Location.mode
 */
export const LocationMode = Schema.Enums({
  instance: 'instance',
  kind: 'kind',
} as const)

/** Decoded mode value for a {@link Location}. */
export type LocationMode = typeof LocationMode.Type
