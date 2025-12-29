import { Link } from 'react-router'
import type { QuestionnaireResponse } from '@assessmentis/clinical-domain/content-management'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import classes from './QuestionnaireResponseListItem.module.css'

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
    <>
      <Link
        to={`/QuestionnaireResponse/${item.id}`}
        className={classes.QuestionnaireResponseListItem__content}
      >
        <strong>{displayName}</strong>
        {lastUpdated ? (
          <span className={classes.QuestionnaireResponseListItem__metadata}>
            Updated: {lastUpdated}
          </span>
        ) : undefined}
      </Link>
      <ResourceItemActions
        viewPath={`/QuestionnaireResponse/${item.id}`}
        editPath={`/QuestionnaireResponse/${item.id}`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
