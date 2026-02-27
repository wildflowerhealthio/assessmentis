import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CodeableConceptEncoded } from '@assessmentis/clinical-domain/data-types'
import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { CodingEncodedFromFhir } from './Coding'
import { mutableEncoded } from '@assessmentis/util'
import { ElementIdentification, type BaseUrl } from '../UrlIdentification'
import { ExtensionEncodedFromFhir } from '../special-purpose'

export const CodeableConceptEncodedFromFhir: Schema.Schema<
  CodeableConceptEncoded,
  FhirR4.CodeableConcept,
  BaseUrl
> = Schema.extend(
  ElementIdentification('CodeableConcept'),
  mutableEncoded(
    Schema.Struct({
      extension: Schema.optional(
        mutableEncoded(Schema.Array(ExtensionEncodedFromFhir))
      ),
      coding: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodingEncodedFromFhir))
        )
      ),
      text: Schema.optional(Schema.String),
    })
  )
)

const FhirR4CodeableConceptSchema: Schema.Schema<
  CodeableConcept,
  FhirR4.CodeableConcept,
  BaseUrl
> = Schema.compose(CodeableConceptEncodedFromFhir, CodeableConcept)

export const FhirR4CodeableConcept = {
  Schema: FhirR4CodeableConceptSchema,
}
