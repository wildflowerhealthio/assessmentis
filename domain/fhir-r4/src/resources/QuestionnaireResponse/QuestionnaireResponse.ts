import { Schema } from 'effect'

import {
  QuestionnaireResponse,
  QuestionnaireResponseStatus,
  type QuestionnaireResponseEncoded,
} from '@assessmentis/clinical-domain'
import { mutableEncoded, TwoStepExternalSchema } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { QuestionnaireResponseItemEncodedFromFhir } from './QuestionnaireResponseItem'

const EncodedFromFhir: Schema.Schema<
  QuestionnaireResponseEncoded,
  FhirR4.QuestionnaireResponse,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource(
    'QuestionnaireResponse',
    'QuestionnaireResponse'
  ),
  mutableEncoded(
    Schema.Struct({
      author: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      authored: Schema.optional(Schema.String),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      encounter: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      identifier: Schema.optional(
        Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
      ),
      item: Schema.optional(
        mutableEncoded(Schema.Array(QuestionnaireResponseItemEncodedFromFhir))
      ),
      partOf: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      questionnaire: Schema.optional(Schema.String),
      source: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
      status: QuestionnaireResponseStatus,
      subject: Schema.optional(
        Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
      ),
    })
  )
)

export const FhirR4QuestionnaireResponse = new TwoStepExternalSchema<
  QuestionnaireResponse,
  QuestionnaireResponseEncoded,
  FhirR4.QuestionnaireResponse,
  BaseUrl
>(QuestionnaireResponse, EncodedFromFhir)
