import { useNavigate } from 'react-router'
import { useRuntime } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PatientForm } from 'app/modules/resources/Patient/components/PatientForm'
import { createPatient } from 'app/modules/resources/Patient/actions/createPatient'
import { PatientFormData } from 'app/modules/resources/Patient/schemas/PatientFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export default function CreatePatientPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntime()

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
