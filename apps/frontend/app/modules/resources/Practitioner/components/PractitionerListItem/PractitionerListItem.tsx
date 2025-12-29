import { Link } from 'react-router'
import type { Practitioner } from '@assessmentis/clinical-domain/administration'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getPractitionerDisplayName,
  getPractitionerQualification,
} from '../../utils/practitionerDisplay'
import classes from './PractitionerListItem.module.css'

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
        className={classes.PractitionerListItem__content}
      >
        <strong>{displayName}</strong>
        <span className={classes.PractitionerListItem__metadata}>
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
