import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { ObservationForm } from 'app/modules/resources/Observation/components/ObservationForm'
import { createObservation } from 'app/modules/resources/Observation/actions/createObservation'
import type { ObservationFormSchema } from 'app/modules/resources/Observation/schemas/ObservationFormSchema'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Effect } from 'effect'
import { usePlatformContext } from '../layers/PlatformContext'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<typeof ObservationFormSchema.Encoded> =
  Promise.resolve({
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
  })

export default function CreateObservationPage() {
  const navigate = useNavigate()
  const { clinicalDataRepositoryService } = usePlatformContext()

  useBreadcrumbs([
    { label: 'Observations', href: '/Observation' },
    { label: 'New' },
  ])

  const handleSubmit = async (formData: typeof ObservationFormSchema.Type) => {
    const observation = await Effect.runPromise(
      createObservation(formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )
    navigate(`/Observation/${observation.id}`)
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
