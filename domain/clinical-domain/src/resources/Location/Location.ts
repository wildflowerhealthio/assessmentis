import { Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import { Coding } from '../../data-types/complex/Coding'
import { Code } from '../../data-types/complex/Code'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Address } from '../../data-types/complex/Address'
import { LocationMode } from './LocationMode'
import { LocationStatus } from './LocationStatus'

const Key = 'Location' as const
type Key = typeof Key

const fields = {
  operationalStatus: Schema.optional(Schema.suspend(() => Coding)),
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  name: Schema.optional(Schema.String),
  alias: Schema.optional(Schema.Array(Schema.String)),
  description: Schema.optional(Schema.String),
  status: Schema.optional(LocationStatus),
  mode: Schema.optional(LocationMode),
  type: Schema.optional(Schema.Array(Schema.suspend(() => CodeableConcept))),
  telecom: Schema.optional(Schema.Array(Schema.suspend(() => ContactPoint))),
  address: Schema.optional(Schema.suspend(() => Address)),
  physicalType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  position: Schema.optional(
    Schema.Struct({
      longitude: Schema.Number,
      latitude: Schema.Number,
      altitude: Schema.optional(Schema.Number),
    })
  ),
  managingOrganization: Schema.optional(Schema.suspend(() => Reference)),
  partOf: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

export interface LocationEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<Key> {}

/**
 * Details and position information for a physical place where services are
 * provided and resources and participants may be stored, found, contained,
 * or accommodated.
 */
export class Location extends MergeClasses<Location>(Key)(
  resourceMixin,
  fields
) {}

/**
 * Checks if a location entry represents a virtual location (e.g., video room).
 * Virtual locations are identified by a physical type coding with code 'vi'.
 */
export const isVirtualLocation = (locationEntry: {
  physicalType?: { coding?: { code?: Code }[] }
}): boolean => {
  return (
    locationEntry.physicalType?.coding?.some(
      (c) => c.code === Code.make('vi')
    ) ?? false
  )
}
