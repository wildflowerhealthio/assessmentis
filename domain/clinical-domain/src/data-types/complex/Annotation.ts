import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { Element } from '../base/Element'
import { Reference } from './IdentifierAndReference'

export const AnnotationId = Schema.String.pipe(Schema.brand('AnnotationId'))
export type AnnotationId = typeof AnnotationId.Type

/**
 * A text note which also contains information about who made the statement and when.
 */
export interface Annotation extends Element<AnnotationId> {
  /**
   * The individual responsible for making the annotation.
   * This is a choice element in FHIR (author[x]) - only one of authorString or authorReference should be present.
   */
  authorString?: string
  authorReference?: Reference
  /**
   * Indicates when this particular annotation was made.
   */
  time?: DateTime.Utc
  /**
   * The text of the annotation in markdown format.
   */
  text: string
}

export const Annotation = {
  Schema: Schema.extend(
    Element.Schema(AnnotationId),
    Schema.mutable(
      Schema.Struct({
        /**
         * The individual responsible for making the annotation.
         * This is a choice element in FHIR (author[x]) - only one of authorString or authorReference should be present.
         */
        authorString: Schema.optional(Schema.String),
        /**
         * The individual responsible for making the annotation.
         */
        authorReference: Schema.optional(
          Schema.suspend(() => Reference.Schema)
        ),
        /**
         * Indicates when this particular annotation was made.
         */
        time: Schema.optional(Schema.DateTimeUtc),
        /**
         * The text of the annotation in markdown format.
         */
        text: Schema.String,
      })
    )
  ),
}
