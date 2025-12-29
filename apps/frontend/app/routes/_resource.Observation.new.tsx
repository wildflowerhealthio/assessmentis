import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { ObservationForm } from 'app/modules/resources/Observation/components/ObservationForm'
import { createObservation } from 'app/modules/resources/Observation/actions/createObservation'
import { ObservationFormSchema } from 'app/modules/resources/Observation/schemas/ObservationFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

export default function CreateObservationPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  useBreadcrumbs([
    { label: 'Observations', href: '/Observation' },
    { label: 'New' },
  ])

  const handleSubmit = async (formData: typeof ObservationFormSchema.Type) => {
    const observation = await clientRuntime.runPromise(
      createObservation(formData)
    )
    navigate(`/Observation/${observation.id}`)
  }

  // Provide default values to prevent uncontrolled input warnings
  const defaultValues: typeof ObservationFormSchema.Encoded = {
    patientId: undefined,
    encounterId: undefined,
    code: '',
    valueType: 'valueQuantity',
    valueString: undefined,
    valueDecimal: undefined,
    valueQuantityValue: undefined,
    valueQuantityUnit: undefined,
    valueCodeableConceptText: undefined,
    valueCodeableConceptCodingCode: undefined,
    valueCodeableConceptCodingSystem: undefined,
    valueCodeableConceptCodingDisplay: undefined,
    effectiveDateTime: undefined,
  }

  return (
    <FormPage title="Create New Observation">
      <ObservationForm
        onSubmit={handleSubmit}
        submitLabel="Create Observation"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
