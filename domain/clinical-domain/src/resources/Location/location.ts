import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses, makeCloneWith } from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Address } from '../../data-types/complex/address'
import { Code } from '../../data-types/complex/code'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Coding } from '../../data-types/complex/coding'
import { ContactPoint } from '../../data-types/complex/contact-point'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import { LocationMode } from './location-mode'
import { LocationStatus } from './location-status'

const DomainType = 'Location' as const
type DomainType = typeof DomainType

const fields = {
  address: Schema.optional(Schema.suspend(() => Address)),
  alias: Schema.optional(
    Schema.Array(Schema.String).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  description: Schema.optional(Schema.String),
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  managingOrganization: Schema.optional(Schema.suspend(() => Reference)),
  mode: Schema.optional(LocationMode),
  name: Schema.optional(Schema.String),
  operationalStatus: Schema.optional(Schema.suspend(() => Coding)),
  partOf: Schema.optional(Schema.suspend(() => Reference)),
  physicalType: Schema.optional(Schema.suspend(() => CodeableConcept)),
  position: Schema.optional(
    Schema.Struct({
      longitude: Schema.Finite,
      latitude: Schema.Finite,
      altitude: Schema.optional(Schema.Finite),
    })
  ),
  status: Schema.optional(LocationStatus),
  telecom: Schema.optional(
    Schema.Array(Schema.suspend(() => ContactPoint)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  type: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
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
export class Location extends MergeClasses<Location>(DomainType)([], LocationResource, fields) {
  readonly cloneWith = makeCloneWith(Location, this)
}

/**
 * Checks if a location entry represents a virtual location (e.g., video room).
 * Virtual locations are identified by a physical type coding with code 'vi'.
 */
export const isVirtualLocation = (locationEntry: {
  physicalType?: { coding?: readonly { code?: Code }[] }
}): boolean => locationEntry.physicalType?.coding?.some((c) => c.code === Code.make('vi')) ?? false
