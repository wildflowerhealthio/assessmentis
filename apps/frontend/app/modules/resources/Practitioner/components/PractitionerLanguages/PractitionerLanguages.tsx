import type { Practitioner } from '@assessmentis/clinical-domain'
import classes from './PractitionerLanguages.module.css'

interface PractitionerLanguagesProps {
  practitioner: Practitioner
}

export function PractitionerLanguages({
  practitioner,
}: PractitionerLanguagesProps) {
  if (!practitioner.communication || practitioner.communication.length === 0) {
    return null
  }

  return (
    <ul className={classes.Languages}>
      {practitioner.communication.map((lang, i) => (
        <li key={i} className={classes.Languages__item}>
          {lang.text ?? lang.coding?.[0]?.display ?? 'Unknown language'}
        </li>
      ))}
    </ul>
  )
}
