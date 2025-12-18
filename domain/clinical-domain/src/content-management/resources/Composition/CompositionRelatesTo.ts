import {
  BackboneElement,
  Element,
  Identifier,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import { Schema } from 'effect'

const CompositionRelatesToId = Schema.String.pipe(
  Schema.brand('CompositionRelatesToId')
)
/**
 * Relationships to other compositions/documents
 */
export const CompositionRelatesTo = Schema.Struct({
  ...BackboneElement(CompositionRelatesToId).fields,
  /**
   * replaces | transforms | signs | appends
   */
  code: Schema.Union(
    Schema.Literal('replaces'),
    Schema.Literal('transforms'),
    Schema.Literal('signs'),
    Schema.Literal('appends')
  ),
  /**
   * Contains extended information for property 'code'.
   */
  _code: Schema.optional(Element(Schema.String)),
  /**
   * Target of the relationship
   */
  targetIdentifier: Schema.optional(Identifier),
  /**
   * Target of the relationship
   */
  targetReference: Schema.optional(Reference),
})

export type CompositionRelatesTo = typeof CompositionRelatesTo.Type
