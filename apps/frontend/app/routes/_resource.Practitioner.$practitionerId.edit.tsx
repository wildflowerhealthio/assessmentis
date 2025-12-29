import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { useLoadedRuntimeContext } from 'app/clientRuntime'
import { getRuntime } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PractitionerForm } from 'app/modules/resources/Practitioner/components/PractitionerForm'
import { updatePractitioner } from 'app/modules/resources/Practitioner/actions/updatePractitioner'
import { PractitionerFormData } from 'app/modules/resources/Practitioner/schemas/PractitionerFormSchema'
import {
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Practitioner.$practitionerId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getPractitionerDisplayName } from '../modules/resources/Practitioner/utils/practitionerDisplay'

const tryDecodePractitionerId = Schema.decodeOption(PractitionerId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

  const practitioner = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PractitionerRepository

      const practitionerId = yield* practitionerIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(
            new NotFoundError({
              resourceType: 'Practitioner',
              params: { id: params.practitionerId },
            })
          )
        )
      )

      return yield* repository.get(practitionerId)
    })
  )

  return { practitioner }
}

export default function EditPractitionerPage({
  loaderData,
}: Route.ComponentProps) {
  const { practitioner } = loaderData
  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  useBreadcrumbs([
    { label: 'Practitioners', href: '/Practitioner' },
    {
      label: getPractitionerDisplayName(practitioner),
      href: `/Practitioner/${practitioner.id}`,
    },
    { label: 'Edit' },
  ])

  // Transform practitioner to form initial values
  const initialValues: PractitionerFormData = {
    givenName: practitioner.name?.[0]?.given?.[0] ?? '',
    familyName: practitioner.name?.[0]?.family ?? '',
    gender: practitioner.gender ?? undefined,
    qualification: practitioner.qualification?.[0]?.code?.text ?? undefined,
  }

  const handleSubmit = async (formData: PractitionerFormData) => {
    if (!practitioner.id) return

    if (clientRuntime._tag != 'loaded') {
      console.error('Runtime not loaded', clientRuntime)
      return
    }

    await clientRuntime.value.runPromise(
      updatePractitioner(practitioner.id, practitioner, formData)
    )

    // Redirect back to detail page
    navigate(`/Practitioner/${practitioner.id}`)
  }

  return (
    <FormPage title="Edit Practitioner">
      <PractitionerForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
