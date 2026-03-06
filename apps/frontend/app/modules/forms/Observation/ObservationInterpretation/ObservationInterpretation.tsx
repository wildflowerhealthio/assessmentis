import type { Observation } from '@assessmentis/clinical-domain'

import classes from './ObservationInterpretation.module.css'

interface ObservationInterpretationProps {
  observation: Observation
}

export function ObservationInterpretation({
  observation,
}: ObservationInterpretationProps) {
  if (
    (!observation.interpretation || observation.interpretation.length === 0) &&
    (!observation.referenceRange || observation.referenceRange.length === 0)
  ) {
    return null
  }

  return (
    <div className={classes.Interpretation}>
      {observation.interpretation && observation.interpretation.length > 0 ? (
        <div className={classes.Interpretation__row}>
          <span className={classes.Interpretation__label}>Interpretation:</span>
          <span>
            {observation.interpretation
              .map(
                (interp) =>
                  interp.text ?? interp.coding?.[0]?.display ?? 'Unknown'
              )
              .join(', ')}
          </span>
        </div>
      ) : undefined}

      {observation.referenceRange && observation.referenceRange.length > 0 ? (
        <div className={classes.Interpretation__row}>
          <span className={classes.Interpretation__label}>
            Reference Range:
          </span>
          <div>
            {observation.referenceRange.map((range, i) => (
              <div key={i} className={classes.Interpretation__range}>
                {range.low ? (
                  <span>
                    Low: {range.low.value} {range.low.unit ?? ''}
                  </span>
                ) : undefined}
                {range.low && range.high ? ' • ' : undefined}
                {range.high ? (
                  <span>
                    High: {range.high.value} {range.high.unit ?? ''}
                  </span>
                ) : undefined}
                {range.text ? <div>{range.text}</div> : undefined}
              </div>
            ))}
          </div>
        </div>
      ) : undefined}
    </div>
  )
}
