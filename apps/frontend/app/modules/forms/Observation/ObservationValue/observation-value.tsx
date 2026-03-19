import type { Observation } from '@assessmentis/clinical-domain'

import { formatObservationValue } from '@/modules/resources/Observation/utils/observation-display'
import { runEffectSyncFlat } from '@/run-effect-sync'

import classes from './ObservationValue.module.css'

interface ObservationValueProps {
  observation: Observation | NonNullable<Observation['component']>[number]
}

export function ObservationValue({ observation }: ObservationValueProps): React.JSX.Element {
  const value = runEffectSyncFlat(formatObservationValue(observation))

  const isDataAbsent = 'dataAbsentReason' in observation && observation.dataAbsentReason

  return <div className={isDataAbsent ? classes.ObservationValue__absent : undefined}>{value}</div>
}
