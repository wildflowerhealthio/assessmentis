import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { useLoadedRuntimeContext } from 'app/clientRuntime'
import { getRuntime } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { ObservationForm } from 'app/modules/resources/Observation/components/ObservationForm'
import { updateObservation } from 'app/modules/resources/Observation/actions/updateObservation'
import { ObservationFormSchema } from 'app/modules/resources/Observation/schemas/ObservationFormSchema'
import {
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Observation.$observationId.edit'
import { DateTime } from 'effect'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getObservationDisplayName } from '../modules/resources/Observation/utils/observationDisplay'

const tryDecodeObservationId = Schema.decodeOption(ObservationId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const observationIdMaybe = tryDecodeObservationId(params.observationId)

  const observation = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* ObservationRepository

      const observationId = yield* observationIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new NotFoundError({
              resourceType: 'Observation',
              params: { id: params.observationId },
            })
          )
        )
      )

      return yield* repository.get(observationId)
    })
  )

  return { observation }
}

export default function EditObservationPage({
  loaderData,
}: Route.ComponentProps) {
  const { observation } = loaderData
  const navigate = useNavigate()

  useBreadcrumbs([
    { label: 'Observations', href: '/Observation' },
    {
      label: getObservationDisplayName(observation),
      href: `/Observation/${observation.id}`,
    },
    { label: 'Edit' },
  ])
  const clientRuntime = useLoadedRuntimeContext()

  // Determine which value type is present
  let valueType:
    | 'valueString'
    | 'valueDecimal'
    | 'valueQuantity'
    | 'valueCodeableConcept' = 'valueQuantity'
  if ('valueString' in observation) valueType = 'valueString'
  else if ('valueDecimal' in observation) valueType = 'valueDecimal'
  else if ('valueQuantity' in observation) valueType = 'valueQuantity'
  else if ('valueCodeableConcept' in observation)
    valueType = 'valueCodeableConcept'

  // Extract coding from valueCodeableConcept if present
  const firstCoding =
    'valueCodeableConcept' in observation
      ? observation.valueCodeableConcept?.coding?.[0]
      : undefined

  // Transform observation to form initial values
  const initialValues: typeof ObservationFormSchema.Encoded = {
    patientId: observation.subject?.reference?.split('/')[1] ?? '',
    encounterId: observation.encounter?.reference?.split('/')[1],
    code: observation.code.text ?? '',
    valueType,
    valueString:
      'valueString' in observation ? observation.valueString : undefined,
    valueDecimal:
      'valueDecimal' in observation
        ? String(observation.valueDecimal)
        : undefined,
    valueQuantityValue:
      'valueQuantity' in observation
        ? observation.valueQuantity?.value?.toString()
        : undefined,
    valueQuantityUnit:
      'valueQuantity' in observation
        ? observation.valueQuantity?.unit
        : undefined,
    valueCodeableConceptText:
      'valueCodeableConcept' in observation
        ? observation.valueCodeableConcept?.text
        : undefined,
    valueCodeableConceptCodingCode: firstCoding?.code,
    valueCodeableConceptCodingSystem: firstCoding?.system,
    valueCodeableConceptCodingDisplay: firstCoding?.display,
    effectiveDateTime: observation.effectiveDateTime
      ? observation.effectiveDateTime.pipe(DateTime.formatIsoDate)
      : undefined,
  }

  const handleSubmit = async (formData: typeof ObservationFormSchema.Type) => {
    if (!observation.id) return

    if (clientRuntime._tag != 'loaded') {
      console.error('Runtime not loaded', clientRuntime)
      return
    }

    await clientRuntime.value.runPromise(
      updateObservation(observation.id, observation, formData)
    )

    // Redirect back to detail page
    navigate(`/Observation/${observation.id}`)
  }

  return (
    <FormPage title="Edit Observation">
      <ObservationForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
