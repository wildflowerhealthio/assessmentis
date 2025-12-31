import { QuestionnaireRepository } from '@assessmentis/clinical-domain/content-management'
import { createResourcePicker } from '../../../../common/utils/createResourcePicker'
import { humanizeDateTimeForLocalReader } from '../../../../common/utils/dateUtils'
import { DateTime } from 'effect'

function formatQuestionnaireTitle(questionnaire: { title?: string }): string {
  return questionnaire.title || 'Untitled Questionnaire'
}

function formatQuestionnaireSecondary(questionnaire: {
  meta?: { lastUpdated?: DateTime.Utc }
}): string {
  const lastUpdatedValue = questionnaire.meta?.lastUpdated
  const lastUpdated =
    typeof lastUpdatedValue === 'object' && lastUpdatedValue !== null
      ? humanizeDateTimeForLocalReader(lastUpdatedValue)
      : typeof lastUpdatedValue === 'string'
        ? lastUpdatedValue
        : 'Unknown'

  return `Last updated: ${lastUpdated}`
}

export const QuestionnairePicker = createResourcePicker({
  repository: QuestionnaireRepository,
  formatDisplay: formatQuestionnaireTitle,
  formatSecondary: formatQuestionnaireSecondary,
  defaultPlaceholder: 'Select questionnaire(s)...',
  defaultLabel: 'Questionnaire',
})
