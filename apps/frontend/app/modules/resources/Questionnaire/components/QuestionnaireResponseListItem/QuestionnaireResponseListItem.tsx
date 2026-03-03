import type { QuestionnaireResponse } from '@assessmentis/clinical-domain'
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
  const displayName =
    item.questionnaire?.toString() ?? item.url?.toString() ?? 'Unnamed Response'
  const lastUpdated = item.meta?.lastUpdated
    ? new Date(item.meta.lastUpdated.epochMillis).toLocaleDateString()
    : null

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={lastUpdated ? [`Updated: ${lastUpdated}`] : []}
      viewPath={`/QuestionnaireResponse/${item.url?.toString()}`}
      editPath={`/QuestionnaireResponse/${item.url?.toString()}`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
