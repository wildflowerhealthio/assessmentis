import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type { Element } from '../base/Element'
import { ElementFromFhirR4 } from '../base/Element'
import type { Reference } from './IdentifierAndReference'
import { ReferenceFromFhirR4 } from './IdentifierAndReference'
import type fhir from 'fhir/r4'

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

export const AnnotationFromFhirR4: Schema.Schema<
  Annotation,
  fhir.Annotation,
  never
> = Schema.extend(
  ElementFromFhirR4(AnnotationId),
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
        Schema.suspend(() => ReferenceFromFhirR4)
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
)
