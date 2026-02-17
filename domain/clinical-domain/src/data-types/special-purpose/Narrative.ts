import { Schema } from 'effect'
import { Element } from '../base/Element'

const NarrativeId = Schema.String.pipe(Schema.brand('NarrativeId'))
type NarrativeId = typeof NarrativeId.Type
const NarrativeStatus = Schema.Union(
  /**The contents of the narrative are entirely generated from the core elements in the content. */
  Schema.Literal('generated'),
  Schema.Literal('extensions'),
  Schema.Literal('additional'),
  Schema.Literal('empty')
)
type NarrativeStatus = typeof NarrativeStatus.Type

export interface Narrative extends Element<NarrativeId> {
  status: NarrativeStatus
  /**
   * Limited xhtml content
   * + Rule: The narrative SHALL contain only the basic html formatting
   * elements and attributes described in chapters 7-11 (except section 4 of
   * chapter 9) and 15 of the HTML 4.0 standard, <a> elements (either name or
   * href), images and internally contained style attributes, and SHALL contain
   * some non-whitespace characters
   */
  div: string
}

export const Narrative = {
  Schema: Schema.extend(
    Element.Schema(NarrativeId),
    Schema.mutable(
      Schema.Struct({
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
      })
    )
  ),
}
