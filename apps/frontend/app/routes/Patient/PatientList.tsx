import { Link } from 'react-router'
import type {
  Patient,
  PatientId,
} from '@assessmentis/clinical-domain/administration'

const PatientList = ({
  patients,
  deletePatient,
}: {
  patients: { data: Patient; loading: boolean }[]
  deletePatient: (id: PatientId | undefined) => Promise<void>
}) => {
  return (
    <div>
      <h2 className="heading-3">Patient List</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {patients.map(({ data: patient, loading }, index) => {
          const displayName = patient.name?.[0]
            ? `${patient.name[0].given?.join(' ') ?? ''} ${patient.name[0].family ?? ''}`.trim()
            : 'Unnamed Patient'

          const birthDateStr = patient.birthDate
            ? new Date(patient.birthDate).toLocaleDateString()
            : 'Unknown'

          return (
            <li
              key={patient.id ?? index}
              style={{
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                ...(loading ? { opacity: 0.5 } : {}),
              }}
            >
              <button
                className="button-3 ghost"
                onClick={() => deletePatient(patient.id)}
                disabled={loading}
                aria-label="Delete patient"
                style={{ border: 'none' }}
              >
                ❌
              </button>
              <Link
                to={`/Patient/${patient.id}`}
                className="body-3"
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <strong>{displayName}</strong>
                <div
                  style={{
                    fontSize: '0.9em',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {patient.gender ?? 'Unknown gender'} • Born: {birthDateStr}
                  {patient.active === false && ' • Inactive'}
                </div>
              </Link>
            </li>
          )
        })}
        {patients.length === 0 && (
          <li
            className="body-3"
            style={{
              padding: 'var(--space-3)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No patients found.
          </li>
        )}
      </ul>
    </div>
  )
}

export default PatientList
