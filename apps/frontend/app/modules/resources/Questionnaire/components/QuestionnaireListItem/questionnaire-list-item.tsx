import type { Questionnaire } from '@assessmentis/clinical-domain'

import { ResourceListItem } from '../../../ResourcePages/ResourceListItem/resource-list-item'

interface QuestionnaireListItemProps {
  item: Questionnaire
  onDelete: () => void
  loading: boolean
}

export function QuestionnaireListItem({
  item,
  onDelete,
  loading,
}: QuestionnaireListItemProps): React.JSX.Element {
  const displayName = item.title ?? item.url?.toString() ?? 'Unnamed Questionnaire'
  const status = item.status ?? 'unknown'

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={[` Status: ${status}`]}
      viewPath={`/Questionnaire/${item.url?.asUriComponent() ?? ''}`}
      editPath={`/Questionnaire/${item.url?.asUriComponent() ?? ''}`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
