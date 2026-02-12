import type { Questionnaire } from '@assessmentis/clinical-domain/content-management'
import { ResourceListItem } from '../../../ResourcePages/ResourceListItem/ResourceListItem'

interface QuestionnaireListItemProps {
  item: Questionnaire
  onDelete: () => void
  loading: boolean
}

export function QuestionnaireListItem({
  item,
  onDelete,
  loading,
}: QuestionnaireListItemProps) {
  const displayName = item.title ?? item.id ?? 'Unnamed Questionnaire'
  const status = item.status ?? 'unknown'

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={[` Status: ${status}`]}
      viewPath={`/Questionnaire/${item.id}`}
      editPath={`/Questionnaire/${item.id}`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
