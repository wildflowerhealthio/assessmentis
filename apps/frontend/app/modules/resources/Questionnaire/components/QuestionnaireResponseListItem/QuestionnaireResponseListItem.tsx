import type { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import { ResourceListItem } from '../../../ResourcePages/ResourceListItem/ResourceListItem'

interface QuestionnaireResponseListItemProps {
  item: QuestionnaireResponse
  onDelete: () => void
  loading: boolean
}

export function QuestionnaireResponseListItem({
  item,
  onDelete,
  loading,
}: QuestionnaireResponseListItemProps) {
  const displayName = item.questionnaire ?? item.id ?? 'Unnamed Response'
  const lastUpdated = item.meta?.lastUpdated
    ? new Date(item.meta.lastUpdated.epochMillis).toLocaleDateString()
    : null

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={lastUpdated ? [`Updated: ${lastUpdated}`] : []}
      viewPath={`/QuestionnaireResponse/${item.id}`}
      editPath={`/QuestionnaireResponse/${item.id}`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
