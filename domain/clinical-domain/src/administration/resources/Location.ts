import { Data, Schema } from 'effect'
import { DomainResource } from '../../data-types/base/DomainResource'
import {
  Address,
  CodeableConcept,
  Coding,
  ContactPoint,
  Identifier,
  Reference,
  Code,
} from '../../data-types'
import { LocationMode } from '../value-sets/LocationMode'
import { LocationStatus } from '../value-sets/LocationStatus'

export const LocationId = Schema.String.pipe(Schema.brand('LocationId'))

export type LocationId = typeof LocationId.Type

/**
 * Schema for transforming between Location Data objects and FHIR R4 Location resources.
 *
 * Details and position information for a physical place where services are provided
 * and resources and participants may be stored, found, contained, or accommodated.
 */
export const LocationFromFhirR4 = Schema.Struct({
  ...DomainResource(LocationId).fields,
  resourceType: Schema.Literal('Location'),
  /**
   * The operational status of the location (e.g. closed temporarily).
   */
  operationalStatus: Schema.optional(Schema.suspend(() => Coding)),
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  /**
   * A name associated with the location.
   */
  name: Schema.optional(Schema.String),
  /**
   * A list of alternate names that the location is known as.
   */
  alias: Schema.optional(Schema.Array(Schema.String)),
  /**
   * Additional details about the location.
   */
  description: Schema.optional(Schema.String),
  /**
   * Indicates whether the location is still in use.
   */
  status: Schema.optional(LocationStatus),
  /**
   * Indicates whether this Location is a specific instance or a kind/class of locations.
   */
  mode: Schema.optional(LocationMode),
  /**
   * A list of physical types for this location.
   */
  type: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  /**
   * Contact details for the location.
   */
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  /**
   * Physical location details.
   */
  address: Schema.optional(Schema.suspend(() => Address)),
  /**
   * The physical type of the location (e.g. room, building).
   */
  physicalType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  /**
   * The absolute geographic location.
   */
  position: Schema.optional(
    Schema.Struct({
      longitude: Schema.Number,
      latitude: Schema.Number,
      altitude: Schema.optional(Schema.Number),
    })
  ),
  /**
   * Organization responsible for this location.
   */
  managingOrganization: Schema.optional(Schema.suspend(() => Reference)),
  /**
   * Another location this location is physically a part of.
   */
  partOf: Schema.optional(Schema.suspend(() => Reference)),
})

/**
 * Location Data type
 */
export type Location = typeof LocationFromFhirR4.Type

/**
 * Location namespace providing factory and utility functions
 */

export const Location = {
  /**
   * Create a new Location instance
   */
  make: Data.case<Location>(),

  /**
   * Checks if a location entry represents a virtual location (e.g., video room).
   * Virtual locations are identified by a physical type coding with code 'vi'.
   *
   * @param locationEntry - An object with an optional physicalType field
   * @returns true if the location is virtual, false otherwise
   */
  isVirtualLocation: (locationEntry: {
    physicalType?: { coding?: ReadonlyArray<{ code?: Code }> }
  }): boolean => {
    return (
      locationEntry.physicalType?.coding?.some(
        (c) => c.code === Code.make('vi')
      ) ?? false
    )
  },
}
