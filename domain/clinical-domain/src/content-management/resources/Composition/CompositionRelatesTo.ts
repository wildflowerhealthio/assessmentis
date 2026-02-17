import { Schema } from 'effect'
import { BackboneElement } from '../../../data-types/base/BackboneElement'
import { Identifier, Reference } from '../../../data-types/complex/IdentifierAndReference'

const CompositionRelatesToId = Schema.String.pipe(
  Schema.brand('CompositionRelatesToId')
)
type CompositionRelatesToId = typeof CompositionRelatesToId.Type

export interface CompositionRelatesTo extends BackboneElement<CompositionRelatesToId> {
  code: 'replaces' | 'transforms' | 'signs' | 'appends'
  targetIdentifier?: Identifier
  targetReference?: Reference
}

/**
 * Relationships to other compositions/documents
 */
export const CompositionRelatesTo = {
  Schema: Schema.extend(
    BackboneElement.Schema(CompositionRelatesToId),
    Schema.Struct({
      code: Schema.Union(
        Schema.Literal('replaces'),
        Schema.Literal('transforms'),
        Schema.Literal('signs'),
        Schema.Literal('appends')
      ),
      targetIdentifier: Schema.optional(
        Schema.suspend(() => Identifier.Schema)
      ),
      targetReference: Schema.optional(Schema.suspend(() => Reference.Schema)),
    })
  ),
}
