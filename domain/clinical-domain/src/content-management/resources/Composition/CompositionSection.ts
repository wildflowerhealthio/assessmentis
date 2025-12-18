import {
  BackboneElement,
  Element,
  CodeableConcept,
  Narrative,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import { Schema } from 'effect'

const CompositionSectionId = Schema.String.pipe(
  Schema.brand('CompositionSectionSectionId')
)

const sectionFields = {
  ...BackboneElement(CompositionSectionId).fields,
  /**
   * Label for section (e.g. for ToC)
   */
  title: Schema.optional(Schema.String),
  /**
   * Contains extended information for property 'title'.
   */
  _title: Schema.optional(Element(Schema.String)),
  /**
   * Classification of section (recommended)
   */
  code: Schema.optional(CodeableConcept),
  /**
   * Text summary of the section, for human interpretation
   */
  text: Schema.optional(Narrative),
  /**
   * working | snapshot | changes
   */
  mode: Schema.optional(
    Schema.Union(
      Schema.Literal('working'),
      Schema.Literal('snapshot'),
      Schema.Literal('changes')
    )
  ),
  /**
   * Contains extended information for property 'mode'.
   */
  _mode: Schema.optional(Element(Schema.String)),
  /**
   * Order of section entries
   */
  orderedBy: Schema.optional(CodeableConcept),
  /**
   * A reference to data that supports this section
   */
  entry: Schema.optional(Schema.Array(Reference)),
  /**
   * Why the section is empty
   */
  emptyReason: Schema.optional(CodeableConcept),
}

export interface CompositionSection extends Schema.Struct.Type<
  typeof sectionFields
> {
  /**
   * Nested Section
   */
  readonly section?: undefined | ReadonlyArray<CompositionSection>
}

export interface CompositionSectionEncoded extends Schema.Struct.Encoded<
  typeof sectionFields
> {
  /**
   * Nested Section
   */
  readonly section?: undefined | ReadonlyArray<CompositionSectionEncoded>
}

/**
 * Composition is broken into sections
 */
export const CompositionSection = Schema.Struct({
  ...sectionFields,
  /**
   * Nested Section
   */
  section: Schema.optional(
    Schema.Array(
      Schema.suspend(
        (): Schema.Schema<
          CompositionSection,
          CompositionSectionEncoded,
          never
        > => CompositionSection
      )
    )
  ),
})
