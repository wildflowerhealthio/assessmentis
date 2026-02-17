import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { CodeableConceptId } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'
import { FhirR4Coding } from './Coding'

const FhirR4CodeableConceptSchema: Schema.Schema<
  CodeableConcept,
  FhirR4.CodeableConcept,
  never
> = Schema.extend(
  FhirR4Element.Schema(CodeableConceptId),
  Schema.mutable(
    Schema.Struct({
      coding: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Coding.Schema))
        )
      ),
      text: Schema.optional(Schema.String),
    })
  )
)

export const FhirR4CodeableConcept = {
  Schema: FhirR4CodeableConceptSchema,
}
