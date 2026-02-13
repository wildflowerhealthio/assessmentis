import { Data, Schema } from 'effect'
import type { CodeableConcept as FhirCodeableConcept } from 'fhir/r4'
import { Coding } from './Coding'
import { ElementFromFhirR4, type Element } from '../base/Element'
import type { DeepReadonly } from '@assessmentis/util'

export const CodeableConceptId = Schema.String.pipe(
  Schema.brand('CodeableConceptId')
)

export type CodeableConceptId = typeof CodeableConceptId.Type

export interface CodeableConcept extends Element<CodeableConceptId> {
  readonly coding?: ReadonlyArray<Coding>
  readonly text?: string
}

export const CodeableConcept = {
  make: Data.case<CodeableConcept>(),
}

export const CodeableConceptFromFhirR4: Schema.Schema<
  CodeableConcept,
  DeepReadonly<FhirCodeableConcept>
> = Schema.extend(
  ElementFromFhirR4(CodeableConceptId),
  Schema.Struct({
    /**
     * Codes may be defined very casually in enumerations, or code lists, up to
     * very formal definitions such as SNOMED CT - see the HL7 v3 Core Principles
     * for more information.  Ordering of codings is undefined and SHALL NOT be
     * used to infer meaning. Generally, at most only one of the coding values
     * will be labeled as UserSelected = true.
     */
    coding: Schema.optional(Schema.Array(Schema.suspend(() => Coding))),
    /**
     * Very often the text is the same as a displayName of one of the codings.
     */
    text: Schema.optional(Schema.String),
    // _text?: Element | undefined;
  })
)
