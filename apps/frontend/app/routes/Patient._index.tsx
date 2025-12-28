import PatientList from '../modules/resources/Patient/components/PatientList'
import { usePatientCollection } from '../modules/resources/Patient/hooks/usePatientCollection'
import type { Route } from './+types/Patient._index'
import { Link } from 'react-router'
import { LoadedResult } from '@assessmentis/ontology'

const emptyFilters = {}

export default function PatientPage(_: Route.ComponentProps) {
  const { collection: patients, deleteItem: deletePatient } =
    usePatientCollection(emptyFilters)

  return (
    <>
      <h1 className="heading-1">Patients</h1>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/Patient/new" className="button-2 blue">
          Create New Patient
        </Link>
      </div>
      {LoadedResult.handle(patients, {
        onLoading: () => <p>Loading patients...</p>,
        onError: (error) => <p>Error loading patients: {String(error)}</p>,
        onSuccess: (patientList) => (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <PatientList deletePatient={deletePatient} patients={patientList} />
          </div>
        ),
      })}
    </>
  )
}
