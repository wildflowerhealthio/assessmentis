import { Link } from 'react-router'
import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getPractitionerDisplayName,
  getPractitionerQualification,
} from '../../utils/practitionerDisplay'
import baseListItemClasses from 'app/modules/common/components/BaseListItem/BaseListItem.module.css'

interface PractitionerListItemProps {
  item: Practitioner
  onDelete: () => void
  loading: boolean
}

export function PractitionerListItem({
  item: practitioner,
  onDelete,
  loading,
}: PractitionerListItemProps) {
  const displayName = getPractitionerDisplayName(practitioner)
  const qualification = getPractitionerQualification(practitioner)

  return (
    <>
      <Link
        to={`/Practitioner/${practitioner.id}`}
        className={baseListItemClasses.content}
      >
        <strong>{displayName}</strong>
        <span className={baseListItemClasses.metadata}>
          {practitioner.gender ?? 'Unknown'} • {qualification}
          {practitioner.active === false ? ' • Inactive' : undefined}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Practitioner/${practitioner.id}`}
        editPath={`/Practitioner/${practitioner.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
