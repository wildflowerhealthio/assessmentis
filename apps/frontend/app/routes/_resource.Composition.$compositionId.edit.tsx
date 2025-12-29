import { DateTime, Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { useLoadedRuntimeContext } from 'app/clientRuntime'
import { getRuntime } from 'app/clientRuntime'
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

const tryDecodeCompositionId = Schema.decodeOption(CompositionId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const compositionIdMaybe = tryDecodeCompositionId(params.compositionId)

  const composition = await runtime.runPromise(
    Effect.gen(function* () {
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
  )

  return { composition }
}

export default function EditCompositionPage({
  loaderData,
}: Route.ComponentProps) {
  useBreadcrumbs([
    { label: 'Compositions', href: '/Composition' },
    {
      label: getCompositionDisplayName(loaderData.composition),
      href: `/Composition/${loaderData.composition.id}`,
    },
    { label: 'Edit' },
  ])
  const { composition } = loaderData
  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  // Transform composition to form initial values
  const initialValues: typeof CompositionFormSchema.Encoded = {
    title: composition.title ?? '',
    patientId: composition.subject?.reference?.split('/')[1] ?? undefined,
    date: composition.date
      ? composition.date.pipe(DateTime.formatIsoDate)
      : undefined,
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
