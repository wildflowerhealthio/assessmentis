import type { Practitioner } from '@assessmentis/clinical-domain'

import classes from './PractitionerContactInfo.module.css'

interface PractitionerContactInfoProps {
  practitioner: Practitioner
}

export function PractitionerContactInfo({
  practitioner,
}: PractitionerContactInfoProps): React.JSX.Element | null {
  if (!practitioner.telecom || practitioner.telecom.length === 0) {
    return null
  }

  return (
    <ul className={classes.ContactInfo}>
      {practitioner.telecom.map((contact, i) => (
        <li key={i} className={classes.ContactInfo__item}>
          <span className={classes.ContactInfo__system}>{contact.system}:</span> {contact.value}
          {contact.use ? ` (${contact.use})` : undefined}
        </li>
      ))}
    </ul>
  )
}
