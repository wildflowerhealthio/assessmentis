import { Schema } from 'effect'
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
 * Details and position information for a physical place where services are provided and resources and participants may be stored, found, contained, or accommodated.
 */

export const Location = Schema.Struct({
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

export type Location = typeof Location.Type

/**
 * Checks if a location entry represents a virtual location (e.g., video room).
 * Virtual locations are identified by a physical type coding with code 'vi'.
 *
 * @param locationEntry - An object with an optional physicalType field
 * @returns true if the location is virtual, false otherwise
 */
export const isVirtualLocation = (locationEntry: {
  physicalType?: { coding?: ReadonlyArray<{ code?: Code }> }
}): boolean => {
  return (
    locationEntry.physicalType?.coding?.some(
      (c) => c.code === Code.make('vi')
    ) ?? false
  )
}
