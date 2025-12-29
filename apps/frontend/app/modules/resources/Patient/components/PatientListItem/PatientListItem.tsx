import { Link } from 'react-router'
import type { Patient } from '@assessmentis/clinical-domain/administration'
import { ResourceItemActions } from 'app/modules/common/components/ResourceItemActions/ResourceItemActions'
import { getPatientDisplayName } from '../../utils/patientDisplay'
import classes from './PatientListItem.module.css'

interface PatientListItemProps {
  item: Patient
  onDelete: () => void
  loading: boolean
}

export function PatientListItem({
  item: patient,
  onDelete,
  loading,
}: PatientListItemProps) {
  const displayName = getPatientDisplayName(patient)

  const birthDateStr = patient.birthDate
    ? new Date(patient.birthDate).toLocaleDateString()
    : 'Unknown'

  return (
    <>
      <Link
        to={`/Patient/${patient.id}`}
        className={classes.PatientListItem__content}
      >
        <strong>{displayName}</strong>
        <span className={classes.PatientListItem__metadata}>
          {patient.gender ?? '-'} • Born: {birthDateStr}
          {patient.active === false ? ' • Inactive' : undefined}
        </span>
      </Link>
      <ResourceItemActions
        viewPath={`/Patient/${patient.id}`}
        editPath={`/Patient/${patient.id}/edit`}
        onDelete={onDelete}
        disabled={loading}
      />
    </>
  )
}
