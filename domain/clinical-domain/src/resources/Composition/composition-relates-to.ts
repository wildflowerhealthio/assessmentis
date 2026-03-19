import { Schema } from 'effect'

import { BackboneElement } from '../../data-types/base/backbone-element'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'

/**
 * Relationships to other compositions/documents
 */
export const CompositionRelatesToSchema = Schema.Struct({
  ...BackboneElement('CompositionRelatesTo').fields,
  code: Schema.Union(
    Schema.Literal('replaces'),
    Schema.Literal('transforms'),
    Schema.Literal('signs'),
    Schema.Literal('appends')
  ),
  targetIdentifier: Schema.optional(Schema.suspend(() => Identifier)),
  targetReference: Schema.optional(Schema.suspend(() => Reference)),
})
