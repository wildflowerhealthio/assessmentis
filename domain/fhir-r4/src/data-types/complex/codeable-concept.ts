import { Schema } from 'effect'

import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import type { CodeableConceptEncoded } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ElementEncodedFromFhir } from '../base/element'
import type { BaseUrl } from '../url-identification'
import { FhirR4Coding } from './coding'

const EncodedFromFhir: Schema.Schema<CodeableConceptEncoded, FhirR4.CodeableConcept, BaseUrl> =
  Schema.extend(
    ElementEncodedFromFhir('CodeableConcept'),
    mutableEncoded(
      Schema.Struct({
        coding: Schema.optional(
          mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Coding.EncodedFromExternal)))
        ),
        text: Schema.optional(Schema.String),
      })
    )
  )

export const FhirR4CodeableConcept = new TwoStepExternalSchema(CodeableConcept, EncodedFromFhir)
