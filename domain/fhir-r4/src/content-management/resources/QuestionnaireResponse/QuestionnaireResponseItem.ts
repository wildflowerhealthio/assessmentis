import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  type QuestionnaireResponseItemEncoded,
  type QuestionnaireResponseItemAnswerEncoded,
} from '@assessmentis/clinical-domain'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { BackboneElementEncodedFromFhir } from '../../../data-types/base/BackboneElement'
import type { BaseUrl } from '../../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

const QuestionnaireResponseItemAnswerEncodedFromFhir: Schema.Schema<
  QuestionnaireResponseItemAnswerEncoded,
  FhirR4.QuestionnaireResponseItemAnswer,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('QuestionnaireResponseItemAnswer'),
  mutableEncoded(
    Schema.Struct({
      item: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(
              () => QuestionnaireResponseItemEncodedFromFhir
            )
          )
        )
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    })
  )
)

export const QuestionnaireResponseItemEncodedFromFhir: Schema.Schema<
  QuestionnaireResponseItemEncoded,
  FhirR4.QuestionnaireResponseItem,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('QuestionnaireResponseItem'),
  mutableEncoded(
    Schema.Struct({
      definition: Schema.optional(Schema.String),
      linkId: Schema.String,
      text: Schema.optional(Schema.String),
      item: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(
              () => QuestionnaireResponseItemEncodedFromFhir
            )
          )
        )
      ),
      answer: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(
              () => QuestionnaireResponseItemAnswerEncodedFromFhir
            )
          )
        )
      ),
    })
  )
)
