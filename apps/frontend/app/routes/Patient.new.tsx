import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PatientForm } from 'app/modules/resources/Patient/components/PatientForm'
import { createPatient } from 'app/modules/resources/Patient/actions/createPatient'
import type { PatientFormData } from 'app/modules/resources/Patient/schemas/PatientFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Effect } from 'effect'
import { usePlatformContext } from '../layers/PlatformContext'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<PatientFormData> = Promise.resolve({
  givenName: '',
  familyName: '',
  gender: undefined,
  birthDate: undefined,
  practitionerId: undefined,
})

export default function CreatePatientPage() {
  const navigate = useNavigate()
  const { clinicalDataRepositoryService } = usePlatformContext()
  useBreadcrumbs([{ label: 'Patients', href: '/Patient' }, { label: 'New' }])

  const handleSubmit = async (formData: PatientFormData) => {
    await Effect.runPromise(
      createPatient(formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )
    navigate('/Patient')
  }

  return (
    <FormPage title="Create New Patient">
      <PatientForm
        onSubmit={handleSubmit}
        submitLabel="Create Patient"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
