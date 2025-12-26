import {
  Questionnaire,
  QuestionnaireRepository,
} from '@assessmentis/clinical-domain/content-management'
import { BasePicker } from '../../../common/components/BasePicker/BasePicker'
import { usePickerData } from '../../../common/components/BasePicker/hooks/usePickerData'
import {
  BasePickerProps,
  PickerItem,
} from '../../../common/components/BasePicker/types/PickerTypes'
import { formatDateTime } from '../../../common/components/BasePicker/utils/displayHelpers'

function formatQuestionnaireTitle(questionnaire: Questionnaire): string {
  return questionnaire.title || 'Untitled Questionnaire'
}

function questionnaireToPickerItem(
  questionnaire: Questionnaire
): PickerItem<{ questionnaire: Questionnaire }> {
  const displayName = formatQuestionnaireTitle(questionnaire)
  const lastUpdatedValue = questionnaire.meta?.lastUpdated
  const lastUpdated =
    typeof lastUpdatedValue === 'object' && lastUpdatedValue !== null
      ? formatDateTime(lastUpdatedValue.epochMillis)
      : typeof lastUpdatedValue === 'string'
        ? lastUpdatedValue
        : 'Unknown'

  return {
    id: questionnaire.id!,
    displayName,
    secondaryText: `Last updated: ${lastUpdated}`,
    metadata: { questionnaire },
  }
}

export function QuestionnairePicker(
  props: Omit<
    BasePickerProps<{ questionnaire: Questionnaire }>,
    'items' | 'loading'
  >
) {
  const { items, loading, error } = usePickerData({
    repository: QuestionnaireRepository,
    transform: questionnaireToPickerItem,
  })

  return (
    <BasePicker
      {...props}
      items={items}
      immediate={props.immediate ?? true}
      loading={loading}
      error={error?.message || props.error}
      placeholder={props.placeholder || 'Select questionnaire(s)...'}
      label={props.label || 'Questionnaire'}
    />
  )
}
