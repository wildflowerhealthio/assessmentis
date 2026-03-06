import type { Observation } from '@assessmentis/clinical-domain'

import { formatObservationValue } from 'app/modules/resources/Observation/utils/observationDisplay'
import { runEffectSyncFlat } from 'app/runEffectSync'

import classes from './ObservationValue.module.css'

interface ObservationValueProps {
  observation: Observation | NonNullable<Observation['component']>[number]
}

export function ObservationValue({ observation }: ObservationValueProps) {
  const value = runEffectSyncFlat(formatObservationValue(observation))

  const isDataAbsent =
    'dataAbsentReason' in observation && observation.dataAbsentReason

  return (
    <div
      className={isDataAbsent ? classes.ObservationValue__absent : undefined}
    >
      {value}
    </div>
  )
}
