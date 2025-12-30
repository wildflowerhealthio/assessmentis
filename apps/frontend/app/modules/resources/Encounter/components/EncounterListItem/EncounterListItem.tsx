import { Link } from 'react-router'
import type { Encounter } from '@assessmentis/clinical-domain/administration'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getEncounterDisplayName,
  getEncounterStatus,
  getEncounterPeriodDisplay,
} from '../../utils/encounterDisplay'
import baseClasses from 'app/modules/common/components/styles/BaseListItem.module.css'

interface EncounterListItemProps {
  item: Encounter
  onDelete: () => void
  loading: boolean
}

export function EncounterListItem({
  item: encounter,
  onDelete,
  loading,
}: EncounterListItemProps) {
  const displayName = getEncounterDisplayName(encounter)
  const status = getEncounterStatus(encounter)
  const periodDisplay = getEncounterPeriodDisplay(encounter)

  return (
    <>
      <Link to={`/Encounter/${encounter.id}`} className={baseClasses.content}>
        <strong>{displayName}</strong>
        <span className={baseClasses.metadata}>
          {status} • {periodDisplay}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Encounter/${encounter.id}`}
        editPath={`/Encounter/${encounter.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
