import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CodeableConceptEncoded } from '@assessmentis/clinical-domain/data-types'
import { CodeableConcept } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Coding } from './Coding'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../UrlIdentification'
import { ElementIdentification } from '../base/Element'
import { FhirR4Extension } from '../special-purpose'
import { TwoStepExternalSchema } from '@assessmentis/util'

const EncodedFromFhir: Schema.Schema<
  CodeableConceptEncoded,
  FhirR4.CodeableConcept,
  BaseUrl
> = Schema.extend(
  ElementIdentification('CodeableConcept'),
  mutableEncoded(
    Schema.Struct({
      extension: Schema.optional(
        mutableEncoded(Schema.Array(FhirR4Extension.EncodedFromExternal))
      ),
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
