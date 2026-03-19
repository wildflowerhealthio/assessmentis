import type { Encounter } from '@assessmentis/clinical-domain'

import { runEffectSyncFlat } from '../../../../../run-effect-sync'
import { ResourceListItem } from '../../../ResourcePages/ResourceListItem/resource-list-item'
import {
  getEncounterDisplayName,
  getEncounterPeriodDisplay,
  getEncounterStatus,
} from '../../utils/encounter-display'

interface EncounterListItemProps {
  item: Encounter
  onDelete: () => void
  loading: boolean
}

export function EncounterListItem({
  item: encounter,
  onDelete,
  loading,
}: EncounterListItemProps): React.JSX.Element {
  const displayName = runEffectSyncFlat(getEncounterDisplayName(encounter))
  const status = getEncounterStatus(encounter)
  const periodDisplay = runEffectSyncFlat(getEncounterPeriodDisplay(encounter))

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={[status, periodDisplay].filter((x) => Boolean(x))}
      viewPath={`/Encounter/${encounter.url?.asUriComponent() ?? ''}`}
      editPath={`/Encounter/${encounter.url?.asUriComponent() ?? ''}/edit`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}
