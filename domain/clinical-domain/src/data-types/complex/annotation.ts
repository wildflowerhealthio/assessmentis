import { Schema } from 'effect'

import { Element } from '../base/element'
import type { ElementEncoded } from '../base/element'
import { Reference } from './identifier-and-reference'

const DomainType = 'Annotation'
type DomainType = typeof DomainType

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

/** Encoded (wire-format) shape of an {@link Annotation}. */
export interface AnnotationEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<DomainType> {}

/**
 * A text note which also contains information about who made the statement and when.
 */
export class Annotation extends Schema.Class<Annotation>(DomainType)({
  ...Element(DomainType).fields,
  ...fields,
}) {
  static readonly DomainType = DomainType
}
