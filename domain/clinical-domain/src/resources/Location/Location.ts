import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses } from '@assessmentis/util'

import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import { Address } from '../../data-types/complex/Address'
import { Code } from '../../data-types/complex/Code'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Coding } from '../../data-types/complex/Coding'
import { ContactPoint } from '../../data-types/complex/ContactPoint'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { LocationMode } from './LocationMode'
import { LocationStatus } from './LocationStatus'

const DomainType = 'Location' as const
type DomainType = typeof DomainType

const fields = {
  operationalStatus: Schema.optional(Schema.suspend(() => Coding)),
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  name: Schema.optional(Schema.String),
  alias: Schema.optional(
    Schema.Array(Schema.String).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  description: Schema.optional(Schema.String),
  status: Schema.optional(LocationStatus),
  mode: Schema.optional(LocationMode),
  type: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  telecom: Schema.optional(
    Schema.Array(Schema.suspend(() => ContactPoint)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
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

const LocationResource = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link Location}. */
export interface LocationEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * Details and position information for a physical place where services are
 * provided and resources and participants may be stored, found, contained,
 * or accommodated.
 */
export class Location extends MergeClasses<Location>(DomainType)(
  [],
  LocationResource,
  fields
) {}

/**
 * Checks if a location entry represents a virtual location (e.g., video room).
 * Virtual locations are identified by a physical type coding with code 'vi'.
 */
export const isVirtualLocation = (locationEntry: {
  physicalType?: { coding?: readonly { code?: Code }[] }
}): boolean => {
  return (
    locationEntry.physicalType?.coding?.some(
      (c) => c.code === Code.make('vi')
    ) ?? false
  )
}
