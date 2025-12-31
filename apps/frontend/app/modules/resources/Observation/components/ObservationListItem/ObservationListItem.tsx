import { Link } from 'react-router'
import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getObservationDisplayName,
  getObservationStatus,
  getObservationEffectiveDate,
  formatObservationValue,
} from '../../utils/observationDisplay'
import baseListItemClasses from 'app/modules/common/components/BaseListItem/BaseListItem.module.css'
import { runEffectSync } from '../../../../../clientRuntime'

interface ObservationListItemProps {
  item: Observation
  onDelete: () => void
  loading: boolean
}

export function ObservationListItem({
  item: observation,
  onDelete,
  loading,
}: ObservationListItemProps) {
  const displayName = getObservationDisplayName(observation)
  const status = getObservationStatus(observation)
  const effectiveDate = runEffectSync(getObservationEffectiveDate(observation))
  const value = formatObservationValue(observation)

  return (
    <>
      <Link
        to={`/Observation/${observation.id}`}
        className={baseListItemClasses.content}
      >
        <strong>{displayName}</strong>
        <span className={baseListItemClasses.metadata}>
          {status} • {effectiveDate} • Value: {value}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Observation/${observation.id}`}
        editPath={`/Observation/${observation.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
