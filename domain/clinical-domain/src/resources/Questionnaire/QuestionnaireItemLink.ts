import { Schema } from 'effect'

/** Branded string identifying a questionnaire item within a {@link Questionnaire}. */
export const QuestionnaireItemLink = Schema.String.pipe(
  Schema.brand('QuestionnaireItemLink')
)

/** Branded type for questionnaire item link IDs. */
export type QuestionnaireItemLink = typeof QuestionnaireItemLink.Type
