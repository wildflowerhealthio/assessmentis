import type { Patient } from '@assessmentis/clinical-domain'

import classes from './PatientAddresses.module.css'

interface PatientAddressesProps {
  patient: Patient
}

export function PatientAddresses({ patient }: PatientAddressesProps): React.JSX.Element | null {
  if (!patient.address || patient.address.length === 0) {
    return null
  }

  return (
    <>
      {patient.address.map((addr) => (
        // Is this JSON.stringify questionable?
        <div key={JSON.stringify(addr)} className={classes.Address}>
          {addr.text || (
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
