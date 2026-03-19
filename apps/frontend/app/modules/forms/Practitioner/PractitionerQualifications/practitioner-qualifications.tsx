import type { Practitioner } from '@assessmentis/clinical-domain'

import { humanizeDateRange } from '@/modules/common/utils/date-utils'
import { runEffectSyncFlat } from '@/run-effect-sync'

import classes from './PractitionerQualifications.module.css'

interface PractitionerQualificationsProps {
  practitioner: Practitioner
}

export function PractitionerQualifications({
  practitioner,
}: PractitionerQualificationsProps): React.JSX.Element | null {
  if (!practitioner.qualification || practitioner.qualification.length === 0) {
    return null
  }

  return (
    <ul className={classes.Qualifications}>
      {practitioner.qualification.map((qual, i) => (
        <li key={i} className={classes.Qualifications__item}>
          <strong className={classes.Qualifications__title}>
            {qual.code.text ?? qual.code.coding?.[0]?.display ?? 'Unknown qualification'}
          </strong>
          {qual.period ? (
            <div className={classes.Qualifications__detail}>
              Period: {runEffectSyncFlat(humanizeDateRange(qual.period))}
            </div>
          ) : undefined}
          {qual.issuer ? (
            <div className={classes.Qualifications__detail}>
              Issuer: {qual.issuer.display ?? qual.issuer.reference}
            </div>
          ) : undefined}
        </li>
      ))}
    </ul>
  )
}
