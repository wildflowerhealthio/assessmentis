import { Schema } from 'effect'
import { QuestionnaireResponseId } from './QuestionnaireResponse'

export const BooleanQuestionnaireResponseValueId = Schema.UUID.pipe(
  Schema.brand('BooleanQuestionnaireResponseValueId')
)

export type BooleanQuestionnaireResponseValueId =
  typeof BooleanQuestionnaireResponseValueId.Type

export const BooleanQuestionnaireResponseValue = Schema.Struct({
  booleanQuestionnaireResponseValueId: BooleanQuestionnaireResponseValueId,
  questionnaireResponseItemId: QuestionnaireResponseId,
  value: Schema.String,
})

export type BooleanQuestionnaireResponseValue =
  typeof BooleanQuestionnaireResponseValue.Type
