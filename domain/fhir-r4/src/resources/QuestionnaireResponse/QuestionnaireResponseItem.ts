import { Schema } from 'effect'

import type {
  QuestionnaireResponseItemAnswerEncoded,
  QuestionnaireResponseItemEncoded,
} from '@assessmentis/clinical-domain'
import { FhirR4ChoiceElements } from '@assessmentis/clinical-domain/data-types'
import { extendObjectSchemas, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirChoiceElementTransform } from '../../data-types/base/FhirChoiceElementTransform'
import type { BaseUrl } from '../../data-types/UrlIdentification'

const QuestionnaireResponseItemAnswerEncodedFromFhir: Schema.Schema<
  QuestionnaireResponseItemAnswerEncoded,
  FhirR4.QuestionnaireResponseItemAnswer,
  BaseUrl
> = extendObjectSchemas(
  BackboneElementEncodedFromFhir('QuestionnaireResponseItemAnswer'),
  extendObjectSchemas(
    mutableEncoded(
      Schema.Struct({
        item: Schema.optional(
          mutableEncoded(
            Schema.Array(
              Schema.suspend(() => QuestionnaireResponseItemEncodedFromFhir)
            )
          )
        ),
      })
    ),
    FhirChoiceElementTransform(
      'value',
      FhirR4ChoiceElements['QuestionnaireResponse.item.answer.value[x]']
    )
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
            Schema.suspend(() => QuestionnaireResponseItemEncodedFromFhir)
          )
        )
      ),
      answer: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => QuestionnaireResponseItemAnswerEncodedFromFhir)
          )
        )
      ),
    })
  )
)
