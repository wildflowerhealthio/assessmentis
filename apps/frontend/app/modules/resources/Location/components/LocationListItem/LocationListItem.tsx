import { Link } from 'react-router'
import type { Location } from '@assessmentis/clinical-domain/administration'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import baseListItemClasses from 'app/modules/common/components/BaseListItem/BaseListItem.module.css'
import { getLocationDisplayName } from '../../utils/locationDisplay'

interface LocationListItemProps {
  item: Location
  onDelete: () => void
  loading: boolean
}

export function LocationListItem({
  item: location,
  onDelete,
  loading,
}: LocationListItemProps) {
  const displayName = getLocationDisplayName(location)

  const metadata = [location.status, location.mode]
    .filter(
      (v): v is Exclude<typeof v, undefined> => v != undefined && v.length > 0
    )
    .join(' • ')

  return (
    <>
      <Link
        to={`/Location/${location.id}`}
        className={baseListItemClasses.content}
      >
        <strong>{displayName}</strong>
        <span className={baseListItemClasses.metadata}>
          {metadata.length ? metadata : '-'}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Location/${location.id}`}
        editPath={`/Location/${location.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
