import type { Encounter } from '@assessmentis/clinical-domain'

import { runEffectSyncFlat } from '../../../../../runEffectSync'
import { ResourceListItem } from '../../../ResourcePages/ResourceListItem/ResourceListItem'
import {
  getEncounterDisplayName,
  getEncounterPeriodDisplay,
  getEncounterStatus,
} from '../../utils/encounterDisplay'

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
      viewPath={`/Encounter/${encounter.url?.asUriComponent() ?? ''}`}
      editPath={`/Encounter/${encounter.url?.asUriComponent() ?? ''}/edit`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
