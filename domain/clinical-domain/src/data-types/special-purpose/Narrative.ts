import { Schema } from 'effect'
import { Element, type ElementEncoded } from '../base/Element'
import { MergeClasses } from '@assessmentis/util'

const Key = 'Narrative' as const
type Key = typeof Key

const NarrativeStatus = Schema.Union(
  /**The contents of the narrative are entirely generated from the core elements in the content. */
  Schema.Literal('generated'),
  Schema.Literal('extensions'),
  Schema.Literal('additional'),
  Schema.Literal('empty')
)
type NarrativeStatus = typeof NarrativeStatus.Type

const fields = {
  status: NarrativeStatus,
  /**
   * Limited xhtml content
   * + Rule: The narrative SHALL contain only the basic html formatting
   * elements and attributes described in chapters 7-11 (except section 4 of
   * chapter 9) and 15 of the HTML 4.0 standard, <a> elements (either name or
   * href), images and internally contained style attributes, and SHALL contain
   * some non-whitespace characters
   */
  div: Schema.String,
} as const satisfies Schema.Struct.Fields

const ElementMixin = Element(Key)

export interface NarrativeEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<Key> {}

export class Narrative extends MergeClasses<Narrative>(Key)(
  ElementMixin,
  fields
) {
  static readonly Key = Key
}
