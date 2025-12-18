import { Schema } from 'effect'
import { Coding } from './Coding'
import { Element } from '../base/Element'

export const CodeableConceptId = Schema.String.pipe(
  Schema.brand('CodeableConceptId')
)

export const CodeableConcept = Schema.Struct({
  ...Element(CodeableConceptId).fields,
  /**
   * Codes may be defined very casually in enumerations, or code lists, up to
   * very formal definitions such as SNOMED CT - see the HL7 v3 Core Principles
   * for more information.  Ordering of codings is undefined and SHALL NOT be
   * used to infer meaning. Generally, at most only one of the coding values
   * will be labeled as UserSelected = true.
   */
  coding: Schema.optional(Schema.Array(Coding)),
  /**
   * Very often the text is the same as a displayName of one of the codings.
   */
  text: Schema.optional(Schema.String),
  // _text?: Element | undefined;
})
