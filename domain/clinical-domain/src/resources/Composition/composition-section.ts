import { Schema, pipe } from 'effect'

import { BackboneElement } from '../../data-types/base/backbone-element'
import type { BackboneElementEncoded } from '../../data-types/base/backbone-element'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Reference } from '../../data-types/complex/identifier-and-reference'
import { Narrative } from '../../data-types/special-purpose/narrative'

const fields = {
  code: Schema.optional(Schema.suspend(() => CodeableConcept)),
  emptyReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  entry: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  mode: Schema.optional(
    Schema.Union(Schema.Literal('working'), Schema.Literal('snapshot'), Schema.Literal('changes'))
  ),
  orderedBy: Schema.optional(Schema.suspend(() => CodeableConcept)),
  text: Schema.optional(Schema.suspend(() => Narrative)),
  title: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link CompositionSection}, including recursive nested sections. */
export interface CompositionSectionEncoded
  extends Schema.Struct.Encoded<typeof fields>, BackboneElementEncoded<'CompositionSection'> {
  section?: readonly CompositionSectionEncoded[] | undefined
}

const CompositionSectionBackboneElement = BackboneElement('CompositionSection')
/**
 * Composition is broken into sections
 */
export class CompositionSection extends CompositionSectionBackboneElement.extend<CompositionSection>(
  'CompositionSection'
)({
  ...fields,
  section: Schema.optional(
    pipe(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<CompositionSection, CompositionSectionEncoded> => CompositionSection
        )
      )
    )
  ),
}) {
  static readonly DomainType = CompositionSectionBackboneElement.DomainType
  static readonly UrlSchema = CompositionSectionBackboneElement.UrlSchema
}
