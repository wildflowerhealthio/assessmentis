import { Link } from 'react-router'
import type { Questionnaire } from '@assessmentis/clinical-domain/content-management'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import classes from './QuestionnaireListItem.module.css'

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
    <>
      <Link
        to={`/Questionnaire/${item.id}`}
        className={classes.QuestionnaireListItem__content}
      >
        <strong>{displayName}</strong>
        <span className={classes.QuestionnaireListItem__metadata}>
          Status: {status}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Questionnaire/${item.id}`}
        editPath={`/Questionnaire/${item.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
