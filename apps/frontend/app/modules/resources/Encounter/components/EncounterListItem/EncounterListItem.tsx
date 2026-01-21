import { Link } from 'react-router'
import type { Encounter } from '@assessmentis/clinical-domain/administration'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getEncounterDisplayName,
  getEncounterStatus,
  getEncounterPeriodDisplay,
} from '../../utils/encounterDisplay'
import baseListItemClasses from 'app/modules/common/components/BaseListItem/BaseListItem.module.css'
import { runEffectSync } from '../../../../../runEffectSync'

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
  const displayName = runEffectSync(getEncounterDisplayName(encounter))
  const status = getEncounterStatus(encounter)
  const periodDisplay = runEffectSync(getEncounterPeriodDisplay(encounter))

  return (
    <>
      <Link
        to={`/Encounter/${encounter.id}`}
        className={baseListItemClasses.content}
      >
        <strong>{displayName}</strong>
        <span className={baseListItemClasses.metadata}>
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
