import type { Encounter } from '@assessmentis/clinical-domain/administration'
import {
  getEncounterDisplayName,
  getEncounterStatus,
  getEncounterPeriodDisplay,
} from '../../utils/encounterDisplay'
import { runEffectSyncFlat } from '../../../../../runEffectSync'
import { ResourceListItem } from '../../../ResourcePages/ResourceListItem/ResourceListItem'

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
  const displayName = runEffectSyncFlat(getEncounterDisplayName(encounter))
  const status = getEncounterStatus(encounter)
  const periodDisplay = runEffectSyncFlat(getEncounterPeriodDisplay(encounter))

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={[status, periodDisplay].filter(Boolean) as string[]}
      viewPath={`/Encounter/${encounter.id}`}
      editPath={`/Encounter/${encounter.id}/edit`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
