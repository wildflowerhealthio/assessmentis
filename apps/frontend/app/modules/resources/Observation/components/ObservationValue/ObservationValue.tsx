import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { formatObservationValue } from '../../utils/observationDisplay'
import classes from './ObservationValue.module.css'
import { runEffectSync } from '../../../../../runEffectSync'

interface ObservationValueProps {
  observation: Observation | NonNullable<Observation['component']>[number]
}

export function ObservationValue({ observation }: ObservationValueProps) {
  const value = runEffectSync(formatObservationValue(observation))

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
