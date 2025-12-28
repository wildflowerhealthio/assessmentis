import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PatientForm } from 'app/modules/resources/Patient/components/PatientForm'
import { createPatient } from 'app/modules/resources/Patient/actions/createPatient'
import { PatientFormData } from 'app/modules/resources/Patient/schemas/PatientFormSchema'

export default function CreatePatientPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  const handleSubmit = async (formData: PatientFormData) => {
    await clientRuntime.runPromise(createPatient(formData))
    navigate('/Patient')
  }

  return (
    <FormPage title="Create New Patient">
      <PatientForm onSubmit={handleSubmit} submitLabel="Create Patient" />
    </FormPage>
  )
}
