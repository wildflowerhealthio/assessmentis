import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CodeableConceptEncoded } from '@assessmentis/clinical-domain/data-types'
import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Coding } from './Coding'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../UrlIdentification'
import { ElementEncodedFromFhir } from '../base/Element'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<
  CodeableConceptEncoded,
  FhirR4.CodeableConcept,
  BaseUrl
> = Schema.extend(
  ElementEncodedFromFhir('CodeableConcept'),
  mutableEncoded(
    Schema.Struct({
      coding: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4Coding.EncodedFromExternal))
        )
      ),
      text: Schema.optional(Schema.String),
    })
  )
)

export const FhirR4CodeableConcept = new TwoStepExternalSchema(
  CodeableConcept,
  EncodedFromFhir
)
