import { Schema } from 'effect'
import { BackboneElement } from '../../../data-types/base/BackboneElement'
import { Reference } from '../../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { Narrative } from '../../../data-types/special-purpose/Narrative'

const CompositionSectionId = Schema.String.pipe(
  Schema.brand('CompositionSectionSectionId')
)
type CompositionSectionId = typeof CompositionSectionId.Type

export interface CompositionSection extends BackboneElement<CompositionSectionId> {
  title?: string
  code?: CodeableConcept
  text?: Narrative
  mode?: 'working' | 'snapshot' | 'changes'
  orderedBy?: CodeableConcept
  entry?: Reference[]
  emptyReason?: CodeableConcept
  section?: CompositionSection[]
}

/**
 * Composition is broken into sections
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CompositionSectionSchema: Schema.Schema<CompositionSection, any, never> =
  Schema.extend(
  BackboneElement.Schema(CompositionSectionId),
  Schema.Struct({
    title: Schema.optional(Schema.String),
    code: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    text: Schema.optional(Schema.suspend(() => Narrative.Schema)),
    mode: Schema.optional(
      Schema.Union(
        Schema.Literal('working'),
        Schema.Literal('snapshot'),
        Schema.Literal('changes')
      )
    ),
    orderedBy: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    entry: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
    ),
    emptyReason: Schema.optional(
      Schema.suspend(() => CodeableConcept.Schema)
    ),
    section: Schema.optional(
      Schema.mutable(Schema.Array(
        Schema.suspend(() => CompositionSectionSchema)
      ))
    ),
  })
)

export const CompositionSection = { Schema: CompositionSectionSchema }
