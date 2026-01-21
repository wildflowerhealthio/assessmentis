import { Questionnaire } from '@assessmentis/clinical-domain/content-management'
import { createResourcePicker } from '../../../../common/utils/createResourcePicker'
import { humanizeDateTimeForLocalReader } from '../../../../common/utils/dateUtils'

function formatQuestionnaireTitle(questionnaire: Questionnaire): string {
  return questionnaire.title || 'Untitled Questionnaire'
}

function formatQuestionnaireSecondary(questionnaire: Questionnaire): string {
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
  resourceType: 'Questionnaire',
  formatDisplay: formatQuestionnaireTitle,
  formatSecondary: formatQuestionnaireSecondary,
  defaultPlaceholder: 'Select questionnaire(s)...',
  defaultLabel: 'Questionnaire',
})
