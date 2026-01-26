import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { CompositionForm } from 'app/modules/resources/Composition/components/CompositionForm'
import { createComposition } from 'app/modules/resources/Composition/actions/createComposition'
import {
  CompositionFormData,
  CompositionFormSchema,
} from 'app/modules/resources/Composition/schemas/CompositionFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Effect } from 'effect'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<typeof CompositionFormSchema.Encoded> =
  Promise.resolve({
    title: '',
    patientId: undefined,
  })

export default function CreateCompositionPage() {
  const navigate = useNavigate()
  const { clinicalDataRepositoryService } = usePlatformContext()

  useBreadcrumbs([
    { label: 'Compositions', href: '/Composition' },
    { label: 'New' },
  ])

  const handleSubmit = async (formData: CompositionFormData) => {
    await Effect.runPromise(
      createComposition(formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )
    navigate('/Composition')
  }

  return (
    <FormPage title="Create New Composition">
      <CompositionForm
        onSubmit={handleSubmit}
        submitLabel="Create Composition"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
