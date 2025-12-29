import { usePatientCollection } from '../modules/resources/Patient/hooks/usePatientCollection'
import type { Route } from './+types/_resource.Patient._index'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { PatientListItem } from '../modules/resources/Patient/components/PatientListItem/PatientListItem'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

const emptyFilters = {}

export default function PatientPage(_: Route.ComponentProps) {
  const { collection, deleteItem } = usePatientCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Patients' }])

  return (
    <ResourceListPage
      title="Patients"
      collection={collection}
      createPath="/Patient/new"
      createLabel="Create New Patient"
      onDelete={deleteItem}
      ItemComponent={PatientListItem}
      emptyMessage="No patients found. Create your first patient to get started."
    />
  )
}
