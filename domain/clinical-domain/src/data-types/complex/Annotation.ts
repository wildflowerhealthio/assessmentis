import { Schema } from 'effect'
import { Element } from '../base/Element'
import { Reference, ReferenceEncoded } from '../special-purpose/Reference'

export const AnnotationId = Schema.String.pipe(Schema.brand('AnnotationId'))

const annotationFields = {
  ...Element(AnnotationId).fields,
  /**
   * The individual responsible for making the annotation.
   * This is a choice element in FHIR (author[x]) - only one of authorString or authorReference should be present.
   */
  authorString: Schema.optional(Schema.String),
  /**
   * Indicates when this particular annotation was made.
   */
  time: Schema.optional(Schema.DateTimeUtc),
  /**
   * The text of the annotation in markdown format.
   */
  text: Schema.String,
}

export interface Annotation extends Schema.Struct.Type<
  typeof annotationFields
> {
  readonly authorReference?: Reference | undefined
}

export interface AnnotationEncoded extends Schema.Struct.Encoded<
  typeof annotationFields
> {
  readonly authorReference?: ReferenceEncoded | undefined
}

/**
 * A text note which also contains information about who made the statement and when.
 */
export const Annotation = Schema.Struct({
  ...annotationFields,
  /**
   * The individual responsible for making the annotation.
   */
  authorReference: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<Reference, ReferenceEncoded, never> => Reference
    )
  ),
})
