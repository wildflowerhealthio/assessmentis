import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import {
  useLoadedRuntimeContext,
  useResourceRunEffect,
} from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { CompositionForm } from 'app/modules/resources/Composition/components/CompositionForm'
import { updateComposition } from 'app/modules/resources/Composition/actions/updateComposition'
import {
  CompositionFormData,
  CompositionFormSchema,
} from 'app/modules/resources/Composition/schemas/CompositionFormSchema'
import {
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Composition.$compositionId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getCompositionDisplayName } from '../modules/resources/Composition/utils/compositionDisplay'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

const tryDecodeCompositionId = Schema.decodeOption(CompositionId)

export default function EditCompositionPage({ params }: Route.ComponentProps) {
  const compositionLoader = useResourceRunEffect(
    useMemo(() => {
      const compositionIdMaybe = tryDecodeCompositionId(params.compositionId)

      return Effect.gen(function* () {
        const repository = yield* CompositionRepository

        const compositionId = yield* compositionIdMaybe.pipe(
          Option.map(Effect.succeed),
          Option.getOrElse(() =>
            Effect.fail(
              new NotFoundError({
                resourceType: 'Composition',
                params: { id: params.compositionId },
              })
            )
          )
        )

        return yield* repository.get(compositionId)
      })
    }, [params.compositionId])
  )

  useBreadcrumbs([
    { label: 'Compositions', href: '/Composition' },
    {
      loading: compositionLoader._tag === 'loading',
      label:
        compositionLoader._tag === 'loaded'
          ? getCompositionDisplayName(compositionLoader.value)
          : 'Unknown Composition',
      href: `/Composition/${params.compositionId}`,
    },
    { label: 'Edit' },
  ])
  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  if (compositionLoader._tag == 'loading') {
    return (
      <FormPage title="Edit Composition">
        <Skeleton count={5} height={40} style={{ marginBottom: '1rem' }} />
      </FormPage>
    )
  }
  if (compositionLoader._tag === 'error') {
    throw compositionLoader.error
  }

  const composition = compositionLoader.value
  // Transform composition to form initial values
  const initialValues: typeof CompositionFormSchema.Encoded = {
    title: composition.title ?? '',
    patientId: extractReferenceId(composition.subject),
  }

  const handleSubmit = async (formData: CompositionFormData) => {
    if (!composition.id) return

    if (clientRuntime._tag != 'loaded') {
      console.error('Runtime not loaded', clientRuntime)
      return
    }

    await clientRuntime.value.runPromise(
      updateComposition(composition.id, composition, formData)
    )

    // Redirect back to detail page
    navigate(`/Composition/${composition.id}`)
  }

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
