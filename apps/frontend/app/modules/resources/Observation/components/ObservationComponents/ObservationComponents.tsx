import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { ObservationValue } from '../ObservationValue/ObservationValue'
import classes from './ObservationComponents.module.css'

interface ObservationComponentsProps {
  observation: Observation
}

export function ObservationComponents({
  observation,
}: ObservationComponentsProps) {
  if (!observation.component || observation.component.length === 0) {
    return null
  }

  return (
    <div className={classes.Components}>
      {observation.component.map((comp, i) => (
        <div key={i} className={classes.Component}>
          <strong className={classes.Component__title}>
            {comp.code.text ?? comp.code.coding?.[0]?.display ?? 'Component'}
          </strong>
          <div className={classes.Component__value}>
            <ObservationValue observation={comp} />
          </div>
        </div>
      ))}
    </div>
  )
}
