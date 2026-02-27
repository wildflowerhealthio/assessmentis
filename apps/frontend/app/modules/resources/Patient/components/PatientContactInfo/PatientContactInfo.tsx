import type { Patient } from '@assessmentis/clinical-domain'
import classes from './PatientContactInfo.module.css'

interface PatientContactInfoProps {
  patient: Patient
}

export function PatientContactInfo({ patient }: PatientContactInfoProps) {
  if (!patient.telecom || patient.telecom.length === 0) {
    return null
  }

  return (
    <ul className={classes.ContactInfo}>
      {patient.telecom.map((contact, i) => (
        <li key={i} className={classes.ContactInfo__item}>
          <span className={classes.ContactInfo__system}>{contact.system}:</span>{' '}
          {contact.value}
          {contact.use ? ` (${contact.use})` : undefined}
        </li>
      ))}
    </ul>
  )
}
