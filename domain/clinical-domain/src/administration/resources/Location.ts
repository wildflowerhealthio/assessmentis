import { Schema } from 'effect'
import { DomainResource } from '../../data-types/base/DomainResource'
import { Identifier } from '../../data-types/complex/Identifier'

export const LocationId = Schema.String.pipe(Schema.brand('LocationId'))
/**
 * Details of a Technology mediated contact point (phone, fax, email, etc.)
 */

export const Location = Schema.Struct({
  ...DomainResource(LocationId).fields,
  resourceType: Schema.Literal('Location'),
  identifier: Schema.optional(Schema.Array(Identifier)),
})
