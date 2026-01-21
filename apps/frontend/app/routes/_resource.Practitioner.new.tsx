import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PractitionerForm } from 'app/modules/resources/Practitioner/components/PractitionerForm'
import { createPractitioner } from 'app/modules/resources/Practitioner/actions/createPractitioner'
import { PractitionerFormData } from 'app/modules/resources/Practitioner/schemas/PractitionerFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { usePlatformContext } from '../layers/PlatformContext'
import { Effect } from 'effect'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<PractitionerFormData> = Promise.resolve({
  givenName: '',
  familyName: '',
  gender: undefined,
  qualification: undefined,
})

export default function CreatePractitionerPage() {
  const navigate = useNavigate()
  const { clinicalDataRepositoryService } = usePlatformContext()
  useBreadcrumbs([
    { label: 'Practitioners', href: '/Practitioner' },
    { label: 'New' },
  ])

  const handleSubmit = async (formData: PractitionerFormData) => {
    await Effect.runPromise(
      createPractitioner(formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )
    navigate('/Practitioner')
  }

  return (
    <FormPage title="Create New Practitioner">
      <PractitionerForm
        onSubmit={handleSubmit}
        submitLabel="Create Practitioner"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
