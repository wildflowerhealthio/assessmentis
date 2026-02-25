import { Schema } from 'effect'
import {
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types/base/BackboneElement'
import { Reference } from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Narrative } from '../../data-types/special-purpose/Narrative'

const fields = {
  title: Schema.optional(Schema.String),
  code: Schema.optional(Schema.suspend(() => CodeableConcept)),
  text: Schema.optional(Schema.suspend(() => Narrative)),
  mode: Schema.optional(
    Schema.Union(
      Schema.Literal('working'),
      Schema.Literal('snapshot'),
      Schema.Literal('changes')
    )
  ),
  orderedBy: Schema.optional(Schema.suspend(() => CodeableConcept)),
  entry: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  emptyReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
} as const satisfies Schema.Struct.Fields

export interface CompositionSectionEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<'CompositionSection'> {
  section?: ReadonlyArray<CompositionSectionEncoded> | undefined
}

/**
 * Composition is broken into sections
 */
export class CompositionSection extends Schema.Class<CompositionSection>(
  'CompositionSection'
)({
  ...BackboneElement('CompositionSection').fields,
  ...fields,
  section: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<CompositionSection, CompositionSectionEncoded> =>
          CompositionSection
      )
    )
  ),
}) {}
