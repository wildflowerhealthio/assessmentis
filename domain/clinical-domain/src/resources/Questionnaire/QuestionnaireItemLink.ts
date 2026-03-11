import { Schema } from 'effect'

export const QuestionnaireItemLink = Schema.String.pipe(
  Schema.brand('QuestionnaireItemLink')
)

export type QuestionnaireItemLink = typeof QuestionnaireItemLink.Type
