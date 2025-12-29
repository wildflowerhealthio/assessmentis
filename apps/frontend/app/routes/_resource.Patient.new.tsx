import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PatientForm } from 'app/modules/resources/Patient/components/PatientForm'
import { createPatient } from 'app/modules/resources/Patient/actions/createPatient'
import { PatientFormData } from 'app/modules/resources/Patient/schemas/PatientFormSchema'
import { useBreadcrumbs } from '../modules/global/components/BreadcrumbProvider/BreadcrumbProvider'

export default function CreatePatientPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  useBreadcrumbs([{ label: 'Patients', href: '/Patient' }, { label: 'New' }])

  const handleSubmit = async (formData: PatientFormData) => {
    await clientRuntime.runPromise(createPatient(formData))
    navigate('/Patient')
  }

  // Provide default values to prevent uncontrolled input warnings
  const defaultValues: PatientFormData = {
    givenName: '',
    familyName: '',
    gender: undefined,
    birthDate: undefined,
    practitionerId: undefined,
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
