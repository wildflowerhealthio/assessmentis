import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PractitionerForm } from 'app/modules/resources/Practitioner/components/PractitionerForm'
import { createPractitioner } from 'app/modules/resources/Practitioner/actions/createPractitioner'
import { PractitionerFormData } from 'app/modules/resources/Practitioner/schemas/PractitionerFormSchema'
import { useBreadcrumbs } from '../modules/global/components/BreadcrumbProvider/BreadcrumbProvider'

export default function CreatePractitionerPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  useBreadcrumbs([
    { label: 'Practitioners', href: '/Practitioner' },
    { label: 'New' },
  ])

  const handleSubmit = async (formData: PractitionerFormData) => {
    await clientRuntime.runPromise(createPractitioner(formData))
    navigate('/Practitioner')
  }

  // Provide default values to prevent uncontrolled input warnings
  const defaultValues: PractitionerFormData = {
    givenName: '',
    familyName: '',
    gender: undefined,
    qualification: undefined,
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
