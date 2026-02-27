import { Schema } from 'effect'
import { Coding, type CodingEncoded } from './Coding'
import { Element, type ElementEncoded } from '../base/Element'
import { MergeClasses } from '@assessmentis/util'
import { Datatype } from '../Datatype'

export const Key = 'CodeableConcept'
export type Key = typeof Key

const fields = {
  /**
   * Codes may be defined very casually in enumerations, or code lists, up to
   * very formal definitions such as SNOMED CT - see the HL7 v3 Core Principles
   * for more information.  Ordering of codings is undefined and SHALL NOT be
   * used to infer meaning. Generally, at most only one of the coding values
   * will be labeled as UserSelected = true.
   */
  coding: Schema.Array(
    Schema.suspend((): Schema.Schema<Coding, CodingEncoded, never> => Coding)
  ).pipe(Schema.optionalWith({ default: () => [] })),
  /**
   * Very often the text is the same as a displayName of one of the codings.
   */
  text: Schema.optional(Schema.String),
  // _text?: Element | undefined;
} as const

export interface CodeableConceptEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<Key> {}

const ElementMixin = Element<Key>(Key)

export class CodeableConcept extends MergeClasses<CodeableConcept>(Key)(
  ElementMixin,
  fields
) {}

export const CodeableConceptDatatype = Datatype(
  'CodeableConcept',
  CodeableConcept
)
