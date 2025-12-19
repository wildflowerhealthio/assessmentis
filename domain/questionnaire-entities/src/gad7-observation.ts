import {
  QuestionnaireItemLink,
  QuestionnaireResponseItem,
} from '@assessmentis/clinical-domain/content-management'
import { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { Schema } from 'effect'

/**
 * GAD-7 Total Score Observation
 * Based on LOINC code 70274-6: "Generalized anxiety disorder 7 item (GAD-7) total score"
 * URL: https://loinc.org/70274-6
 *
 * This observation represents the total score from the GAD-7 assessment,
 * which ranges from 0-21 with scoring as follows:
 * - 0-4: Minimal anxiety
 * - 5-9: Mild anxiety
 * - 10-14: Moderate anxiety
 * - 15-21: Severe anxiety
 */
export const Gad7TotalScoreObservation = Schema.extend(
  Observation,
  Schema.Struct({
    code: Schema.Struct({}),
    valueInteger: Schema.Number,
  })
)
export type Gad7TotalScoreObservation = typeof Gad7TotalScoreObservation.Type

export const Gad7QuestionnaireResponseItem = (linkId: QuestionnaireItemLink) =>
  Schema.extend(
    QuestionnaireResponseItem,
    Schema.Struct({
      linkId: Schema.Literal(linkId),
    })
  )
