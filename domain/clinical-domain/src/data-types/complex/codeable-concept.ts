import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { Element } from '../base/element'
import type { ElementEncoded } from '../base/element'
import { Datatype } from '../datatype'
import { Coding } from './coding'
import type { CodingEncoded } from './coding'

export const DomainType = 'CodeableConcept'
export type DomainType = typeof DomainType

const fields = {
  /**
   * Codes may be defined very casually in enumerations, or code lists, up to
   * very formal definitions such as SNOMED CT - see the HL7 v3 Core Principles
   * for more information.  Ordering of codings is undefined and SHALL NOT be
   * used to infer meaning. Generally, at most only one of the coding values
   * will be labeled as UserSelected = true.
   */
  coding: Schema.Array(Schema.suspend((): Schema.Schema<Coding, CodingEncoded> => Coding)).pipe(
    Schema.optionalWith({ default: () => [] })
  ),
  /**
   * Very often the text is the same as a displayName of one of the codings.
   */
  text: Schema.optional(Schema.String),
  // _text?: Element | undefined;
} as const

/** Encoded (wire-format) shape of a {@link CodeableConcept}. */
export interface CodeableConceptEncoded
  extends Schema.Struct.Encoded<typeof fields>, ElementEncoded<DomainType> {}

const ElementMixin = Element<DomainType>(DomainType)

/**
 * A concept that may be defined by one or more coding systems. Wraps an
 * array of {@link Coding} values plus optional free-text.
 */
export class CodeableConcept extends MergeClasses<CodeableConcept>(DomainType)(
  [],
  ElementMixin,
  fields
) {
  /** {@link Datatype} wrapper for use in {@link DatatypeChoice} value\[x\] unions. */
  static Datatype = Datatype('CodeableConcept', CodeableConcept)
}
