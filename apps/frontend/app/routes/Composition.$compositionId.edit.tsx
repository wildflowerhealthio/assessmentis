import { Effect, Option, pipe, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { CompositionForm } from 'app/modules/resources/Composition/components/CompositionForm'
import { updateComposition } from 'app/modules/resources/Composition/actions/updateComposition'
import {
  CompositionFormData,
  CompositionFormSchema,
} from 'app/modules/resources/Composition/schemas/CompositionFormSchema'
import {
  Composition,
  CompositionId,
} from '@assessmentis/clinical-domain/content-management'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/Composition.$compositionId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getCompositionDisplayName } from '../modules/resources/Composition/utils/compositionDisplay'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useCallback, useMemo } from 'react'
import { usePlatformContext } from '../layers/PlatformContext'
import { useEffectTs } from '../../../../global/react-util/src/hooks/effectHooks'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

const tryDecodeCompositionId = Schema.decodeOption(CompositionId)

export default function EditCompositionPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const repositoryEffect = useMemo(() => {
    return clinicalDataRepositoryService.repositoryEffect<Composition>(
      'Composition'
    )
  }, [clinicalDataRepositoryService])

  const compositionEffect = useMemo(() => {
    return pipe(
      tryDecodeCompositionId(params.compositionId),
      Option.match<
        Effect.Effect<
          CompositionId,
          NotFoundError<'Composition', { id: string }>
        >,
        CompositionId
      >({
        onSome: Effect.succeed,
        onNone: () =>
          Effect.fail(
            new NotFoundError({
              resourceType: 'Composition',
              params: { id: params.compositionId },
            })
          ),
      }),
      Effect.flatMap((compositionId) =>
        Effect.flatMap(repositoryEffect, (repository) =>
          repository.get(compositionId)
        )
      )
    )
  }, [repositoryEffect, params.compositionId])

  const compositionPromise = useEffectTs(compositionEffect)

  const breadcrumbPromise = useMemo(
    () => [
      { label: 'Compositions', href: '/Composition' },
      compositionPromise.then((c) => ({
        label: getCompositionDisplayName(c),
        href: `/Composition/${c.id}`,
      })),
      { label: 'Edit' },
    ],
    [compositionPromise]
  )

  useBreadcrumbs(breadcrumbPromise)
  const navigate = useNavigate()

  // Transform composition to form initial values
  const initialValues: Promise<typeof CompositionFormSchema.Encoded> =
    useMemo(() => {
      return compositionPromise.then((composition) => ({
        title: composition.title ?? '',
        patientId: extractReferenceId(composition.subject),
      }))
    }, [compositionPromise])

  const handleSubmit = useCallback(
    async (formData: CompositionFormData) => {
      const composition = await compositionPromise

      await Effect.runPromise(
        updateComposition(composition.id, composition, formData).pipe(
          Effect.provideService(
            ClinicalDataRepositoryService,
            clinicalDataRepositoryService
          )
        )
      )

      // Redirect back to detail page
      navigate(`/Composition/${composition.id}`)
    },
    [compositionPromise, navigate, clinicalDataRepositoryService]
  )

  return (
    <FormPage title="Edit Composition">
      <CompositionForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
