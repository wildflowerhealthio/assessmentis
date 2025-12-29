import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { CompositionForm } from 'app/modules/resources/Composition/components/CompositionForm'
import { createComposition } from 'app/modules/resources/Composition/actions/createComposition'
import {
  CompositionFormData,
  CompositionFormSchema,
} from 'app/modules/resources/Composition/schemas/CompositionFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export default function CreateCompositionPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  useBreadcrumbs([
    { label: 'Compositions', href: '/Composition' },
    { label: 'New' },
  ])

  const handleSubmit = async (formData: CompositionFormData) => {
    await clientRuntime.runPromise(createComposition(formData))
    navigate('/Composition')
  }

  // Provide default values to prevent uncontrolled input warnings
  const defaultValues: typeof CompositionFormSchema.Encoded = {
    title: '',
    patientId: undefined,
    date: undefined,
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
