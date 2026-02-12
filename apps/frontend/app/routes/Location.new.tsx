import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { LocationForm } from 'app/modules/resources/Location/components/LocationForm'
import { createLocation } from 'app/modules/resources/Location/actions/createLocation'
import type { LocationFormData } from 'app/modules/resources/Location/schemas/LocationFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Effect } from 'effect'
import { usePlatformContext } from '../layers/PlatformContext'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

const defaultValues: Promise<LocationFormData> = Promise.resolve({
  name: '',
  description: undefined,
  status: undefined,
  mode: undefined,
  identifierSystem: undefined,
  identifierValue: undefined,
})

export default function CreateLocationPage() {
  const navigate = useNavigate()
  const { clinicalDataRepositoryService } = usePlatformContext()
  useBreadcrumbs([{ label: 'Locations', href: '/Location' }, { label: 'New' }])

  const handleSubmit = async (formData: LocationFormData) => {
    await Effect.runPromise(
      createLocation(formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )

    navigate('/Location')
  }

  return (
    <FormPage title="Create New Location">
      <LocationForm
        onSubmit={handleSubmit}
        submitLabel="Create Location"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
