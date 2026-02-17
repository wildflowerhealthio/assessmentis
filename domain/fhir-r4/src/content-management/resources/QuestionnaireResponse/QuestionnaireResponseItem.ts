import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type {
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
} from '@assessmentis/clinical-domain/content-management'
import {
  QuestionnaireResponseItemId,
  QuestionnaireResponseItemAnswerId,
  QuestionnaireItemLink,
} from '@assessmentis/clinical-domain/content-management'
import { FhirR4BackboneElement } from '../../../data-types/base/BackboneElement'
import { FhirR4ValueElement } from '../../../data-types/primitive/ValueElement'

const FhirR4QuestionnaireResponseItemAnswerSchema: Schema.Schema<
  QuestionnaireResponseItemAnswer,
  FhirR4.QuestionnaireResponseItemAnswer,
  never
> = Schema.extend(
  Schema.extend(
    FhirR4BackboneElement.Schema(QuestionnaireResponseItemAnswerId),
    Schema.Struct({
      item: Schema.optional(
        Schema.mutable(
          Schema.Array(
            Schema.suspend(
              () => FhirR4QuestionnaireResponseItemSchema
            )
          )
        )
      ),
    })
  ),
  Schema.suspend(() => FhirR4ValueElement.Schema)
)

export const FhirR4QuestionnaireResponseItemAnswer = {
  Schema: FhirR4QuestionnaireResponseItemAnswerSchema,
}

const FhirR4QuestionnaireResponseItemSchema: Schema.Schema<
  QuestionnaireResponseItem,
  FhirR4.QuestionnaireResponseItem,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(QuestionnaireResponseItemId),
  Schema.Struct({
    definition: Schema.optional(Schema.String),
    linkId: QuestionnaireItemLink,
    text: Schema.optional(Schema.String),
    item: Schema.optional(
      Schema.mutable(
        Schema.Array(
          Schema.suspend(
            () => FhirR4QuestionnaireResponseItemSchema
          )
        )
      )
    ),
    answer: Schema.optional(
      Schema.mutable(
        Schema.Array(
          Schema.suspend(
            () => FhirR4QuestionnaireResponseItemAnswerSchema
          )
        )
      )
    ),
  })
)

export const FhirR4QuestionnaireResponseItem = {
  Schema: FhirR4QuestionnaireResponseItemSchema,
}
