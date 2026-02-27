import type { Questionnaire } from '@assessmentis/clinical-domain'
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
  const displayName = item.title ?? item.url?.toString() ?? 'Unnamed Questionnaire'
  const status = item.status ?? 'unknown'

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={[` Status: ${status}`]}
      viewPath={`/Questionnaire/${item.url?.toString()}`}
      editPath={`/Questionnaire/${item.url?.toString()}`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
