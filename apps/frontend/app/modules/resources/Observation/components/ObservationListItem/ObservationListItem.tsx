import { Link } from 'react-router'
import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import {
  getObservationDisplayName,
  getObservationStatus,
  getObservationEffectiveDate,
  formatObservationValue,
} from '../../utils/observationDisplay'
import baseClasses from 'app/modules/common/components/styles/BaseListItem.module.css'

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
  const effectiveDate = getObservationEffectiveDate(observation)
  const value = formatObservationValue(observation)

  return (
    <>
      <Link
        to={`/Observation/${observation.id}`}
        className={baseClasses.content}
      >
        <strong>{displayName}</strong>
        <span className={baseClasses.metadata}>
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
