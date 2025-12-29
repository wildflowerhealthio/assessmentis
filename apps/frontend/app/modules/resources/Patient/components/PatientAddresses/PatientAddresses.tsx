import type { Patient } from '@assessmentis/clinical-domain/administration'
import classes from './PatientAddresses.module.css'

interface PatientAddressesProps {
  patient: Patient
}

export function PatientAddresses({ patient }: PatientAddressesProps) {
  if (!patient.address || patient.address.length === 0) {
    return null
  }

  return (
    <>
      {patient.address.map((addr, i) => (
        <div key={i} className={classes.Address}>
          {addr.text ? (
            addr.text
          ) : (
            <>
              {addr.line?.join(', ')}
              {addr.city ? `, ${addr.city}` : undefined}
              {addr.state ? `, ${addr.state}` : undefined}
              {addr.postalCode ? ` ${addr.postalCode}` : undefined}
              {addr.country ? `, ${addr.country}` : undefined}
            </>
          )}
          {addr.use ? ` (${addr.use})` : undefined}
        </div>
      ))}
    </>
  )
}
