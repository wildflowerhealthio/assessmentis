import { pipe, Schema } from 'effect'
import { DomainResource } from '../../data-types/base/DomainResource'
import { Code, Coding } from '../../data-types/complex/Coding'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Address } from '../../data-types/complex/Address'
import { LocationMode } from '../value-sets/LocationMode'
import { LocationStatus } from '../value-sets/LocationStatus'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { WithSymbolTag } from '@assessmentis/util'
import { Resource } from '@assessmentis/effectful-store'

const ResourceSymbol: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Location'
)
type ResourceSymbol = typeof ResourceSymbol

export const LocationId = Schema.String.pipe(Schema.brand('LocationId'))

export type LocationId = typeof LocationId.Type

/**
 * Location Data type
 */
export interface Location
  extends
    DomainResource<LocationId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl> {
  [Resource.ResourceType]: ResourceSymbol
  resourceType: 'Location'
  operationalStatus?: Coding
  identifier?: Identifier[]
  name?: string
  alias?: string[]
  description?: string
  status?: LocationStatus
  mode?: LocationMode
  type?: CodeableConcept[]
  telecom?: ContactPoint[]
  address?: Address
  physicalType?: CodeableConcept
  position?: {
    longitude: number
    latitude: number
    altitude?: number
  }
  managingOrganization?: Reference
  partOf?: Reference
}

const LocationSchema = pipe(
  DomainResource.Schema(LocationId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Location'),
      /**
       * The operational status of the location (e.g. closed temporarily).
       */
      operationalStatus: Schema.optional(Schema.suspend(() => Coding.Schema)),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
      ),
      /**
       * A name associated with the location.
       */
      name: Schema.optional(Schema.String),
      /**
       * A list of alternate names that the location is known as.
       */
      alias: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
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
      type: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      /**
       * Contact details for the location.
       */
      telecom: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ContactPoint.Schema)))
      ),
      /**
       * Physical location details.
       */
      address: Schema.optional(Schema.suspend(() => Address.Schema)),
      /**
       * The physical type of the location (e.g. room, building).
       */
      physicalType: Schema.optional(
        Schema.suspend(() => CodeableConcept.Schema)
      ),
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
      managingOrganization: Schema.optional(
        Schema.suspend(() => Reference.Schema)
      ),
      /**
       * Another location this location is physically a part of.
       */
      partOf: Schema.optional(Schema.suspend(() => Reference.Schema)),
    })
  )
)

/**
 * Schema for transforming between Location Data objects and FHIR R4 Location resources.
 *
 * Details and position information for a physical place where services are provided
 * and resources and participants may be stored, found, contained, or accommodated.
 */
export const Location = Object.assign(
  ClinicalResourceBehaviourImpl<
    Location,
    Schema.Schema.Encoded<typeof LocationSchema>
  >({
    ResourceSymbol,
    resourceType: 'Location',
    Schema: LocationSchema,
  }),
  {
    /**
     * Checks if a location entry represents a virtual location (e.g., video room).
     * Virtual locations are identified by a physical type coding with code 'vi'.
     *
     * @param locationEntry - An object with an optional physicalType field
     * @returns true if the location is virtual, false otherwise
     */
    isVirtualLocation: (locationEntry: {
      physicalType?: { coding?: { code?: Code }[] }
    }): boolean => {
      return (
        locationEntry.physicalType?.coding?.some(
          (c) => c.code === Code.make('vi')
        ) ?? false
      )
    },
  }
)
