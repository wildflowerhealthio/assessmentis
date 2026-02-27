import type { Practitioner } from '@assessmentis/clinical-domain'
import classes from './PractitionerAddresses.module.css'

interface PractitionerAddressesProps {
  practitioner: Practitioner
}

export function PractitionerAddresses({
  practitioner,
}: PractitionerAddressesProps) {
  if (!practitioner.address || practitioner.address.length === 0) {
    return null
  }

  return (
    <>
      {practitioner.address.map((addr, i) => (
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
