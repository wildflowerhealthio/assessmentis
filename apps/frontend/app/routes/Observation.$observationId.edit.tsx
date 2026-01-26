import { DateTime, Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { useEffectTs } from '@assessmentis/react-util'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { ObservationForm } from 'app/modules/resources/Observation/components/ObservationForm'
import { updateObservation } from 'app/modules/resources/Observation/actions/updateObservation'
import { ObservationFormSchema } from 'app/modules/resources/Observation/schemas/ObservationFormSchema'
import {
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/Observation.$observationId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getObservationDisplayName } from '../modules/resources/Observation/utils/observationDisplay'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'

const tryDecodeObservationId = Schema.decodeOption(ObservationId)

export default function EditObservationPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const observationEffect = useMemo(() => {
    const observationIdMaybe = tryDecodeObservationId(params.observationId)

    return Effect.gen(function* () {
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
    }).pipe(
      Effect.provideServiceEffect(
        ObservationRepository,
        clinicalDataRepositoryService.Observation
      )
    )
  }, [clinicalDataRepositoryService.Observation, params.observationId])

  const observationPromise = useEffectTs(observationEffect)

  const navigate = useNavigate()

  const breadcrumbs = useMemo(
    () => [
      { label: 'Observations', href: '/Observation' },
      observationPromise.then((obs) => ({
        label: getObservationDisplayName(obs),
        href: `/Observation/${params.observationId}`,
      })),
      { label: 'Edit' },
    ],
    [observationPromise, params.observationId]
  )

  useBreadcrumbs(breadcrumbs)

  // Determine which value type is present
  const initialValues: Promise<typeof ObservationFormSchema.Encoded> = useMemo(
    () =>
      observationPromise.then((observation) => {
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

        const firstCoding =
          'valueCodeableConcept' in observation
            ? observation.valueCodeableConcept?.coding?.[0]
            : undefined

        return {
          patientId: extractReferenceId(observation.subject) ?? '',
          encounterId: extractReferenceId(observation.encounter),
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
          effectiveDateTime: observation.effectiveDateTime?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
        }
      }),
    [observationPromise]
  )

  const handleSubmit = async (formData: typeof ObservationFormSchema.Type) => {
    const observation = await observationPromise

    await Effect.runPromise(
      updateObservation(observation.id, observation, formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
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
