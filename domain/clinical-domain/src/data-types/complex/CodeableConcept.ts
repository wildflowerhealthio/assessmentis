import { Data, Schema } from 'effect'
import { Coding, type CodingEncoded } from './Coding'
import { Element, type ElementEncoded } from '../base/Element'

export const CodeableConceptId = Schema.String.pipe(
  Schema.brand('CodeableConceptId')
)

export type CodeableConceptId = typeof CodeableConceptId.Type

export interface CodeableConcept extends Element<CodeableConceptId> {
  coding?: Coding[]
  text?: string
}

export interface CodeableConceptEncoded extends ElementEncoded {
  coding?: CodingEncoded[]
  text?: string
}

const CodeableConceptSchema: Schema.Schema<
  CodeableConcept,
  CodeableConceptEncoded,
  never
> = Schema.extend(
  Element.Schema(CodeableConceptId),
  Schema.mutable(
    Schema.Struct({
      /**
       * Codes may be defined very casually in enumerations, or code lists, up to
       * very formal definitions such as SNOMED CT - see the HL7 v3 Core Principles
       * for more information.  Ordering of codings is undefined and SHALL NOT be
       * used to infer meaning. Generally, at most only one of the coding values
       * will be labeled as UserSelected = true.
       */
      coding: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Coding.Schema)))
      ),
      /**
       * Very often the text is the same as a displayName of one of the codings.
       */
      text: Schema.optional(Schema.String),
      // _text?: Element | undefined;
    })
  )
)

export const CodeableConcept = {
  make: Data.case<CodeableConcept>(),
  Schema: CodeableConceptSchema,
}
