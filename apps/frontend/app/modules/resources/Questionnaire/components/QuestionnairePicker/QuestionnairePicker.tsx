import { QuestionnaireRepository } from '@assessmentis/clinical-domain/content-management'
import { createResourcePicker } from '../../../../common/utils/createResourcePicker'
import { formatDateTime } from '../../../../common/components/BasePicker/utils/displayHelpers'

function formatQuestionnaireTitle(questionnaire: { title?: string }): string {
  return questionnaire.title || 'Untitled Questionnaire'
}

function formatQuestionnaireSecondary(questionnaire: {
  meta?: { lastUpdated?: { epochMillis: number } | string }
}): string {
  const lastUpdatedValue = questionnaire.meta?.lastUpdated
  const lastUpdated =
    typeof lastUpdatedValue === 'object' && lastUpdatedValue !== null
      ? formatDateTime(lastUpdatedValue.epochMillis)
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
