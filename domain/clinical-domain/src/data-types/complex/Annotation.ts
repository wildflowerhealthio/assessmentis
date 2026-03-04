import { Schema } from 'effect'
import type { ElementEncoded } from '../base/Element'
import { Element } from '../base/Element'
import { Reference } from './IdentifierAndReference'

const Key = 'Annotation'
type Key = typeof Key

const fields = {
  /**
   * The individual responsible for making the annotation.
   * This is a choice element in FHIR (author[x]) - only one of authorString or authorReference should be present.
   */
  authorString: Schema.optional(Schema.String),
  /**
   * The individual responsible for making the annotation.
   */
  authorReference: Schema.optional(Schema.suspend(() => Reference)),
  /**
   * Indicates when this particular annotation was made.
   */
  time: Schema.optional(Schema.DateTimeUtc),
  /**
   * The text of the annotation in markdown format.
   */
  text: Schema.String,
} as const

export interface AnnotationEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<Key> {}

/**
 * A text note which also contains information about who made the statement and when.
 */
export class Annotation extends Schema.Class<Annotation>(Key)({
  ...Element(Key).fields,
  ...fields,
}) {
  static readonly DomainType = Key
}
