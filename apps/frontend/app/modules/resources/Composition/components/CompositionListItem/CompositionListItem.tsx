import { Link } from 'react-router'
import type { Composition } from '@assessmentis/clinical-domain/content-management'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getCompositionDisplayName,
  getCompositionType,
} from '../../utils/compositionDisplay'
import baseListItemClasses from 'app/modules/common/components/BaseListItem/BaseListItem.module.css'

interface CompositionListItemProps {
  item: Composition
  onDelete: () => void
  loading: boolean
}

export function CompositionListItem({
  item: composition,
  onDelete,
  loading,
}: CompositionListItemProps) {
  const displayName = getCompositionDisplayName(composition)
  const compositionType = getCompositionType(composition)

  const dateStr = new Date(composition.date.epochMillis).toLocaleDateString()

  return (
    <>
      <Link
        to={`/Composition/${composition.id}`}
        className={baseListItemClasses.content}
      >
        <strong>{displayName}</strong>
        <span className={baseListItemClasses.metadata}>
          {compositionType} • {composition.status} • {dateStr}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Composition/${composition.id}`}
        editPath={`/Composition/${composition.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
