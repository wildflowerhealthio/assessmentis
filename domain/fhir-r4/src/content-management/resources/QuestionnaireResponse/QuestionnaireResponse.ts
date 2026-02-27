import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  QuestionnaireResponse,
  type QuestionnaireResponseEncoded,
  QuestionnaireResponseStatus,
} from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../../data-types/base/Resource'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../../data-types/complex/IdentifierAndReference'
import { QuestionnaireResponseItemEncodedFromFhir } from './QuestionnaireResponseItem'
import type { BaseUrl } from '../../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const FhirR4QuestionnaireResponseEncodedFromFhir: Schema.Schema<
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
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      authored: Schema.optional(Schema.String),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      encounter: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      identifier: Schema.optional(
        Schema.suspend(() => IdentifierEncodedFromFhir)
      ),
      item: Schema.optional(
        mutableEncoded(
          Schema.Array(QuestionnaireResponseItemEncodedFromFhir)
        )
      ),
      partOf: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      questionnaire: Schema.optional(Schema.String),
      source: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      status: QuestionnaireResponseStatus,
      subject: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
    })
  )
)

export const FhirR4QuestionnaireResponse = {
  resourceType: 'QuestionnaireResponse',
  Schema: Schema.compose(
    FhirR4QuestionnaireResponseEncodedFromFhir,
    QuestionnaireResponse
  ),
}
