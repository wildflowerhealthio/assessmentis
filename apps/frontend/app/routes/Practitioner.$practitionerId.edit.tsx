import { Effect, Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PractitionerForm } from 'app/modules/resources/Practitioner/components/PractitionerForm'
import { updatePractitioner } from 'app/modules/resources/Practitioner/actions/updatePractitioner'
import type { PractitionerFormData } from 'app/modules/resources/Practitioner/schemas/PractitionerFormSchema'
import { PractitionerId } from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Practitioner.$practitionerId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getPractitionerDisplayName } from '../modules/resources/Practitioner/utils/practitionerDisplay'
import { useMemo } from 'react'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

const tryDecodePractitionerId = Schema.decodeOption(PractitionerId)

export default function EditPractitionerPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const practitionerStream = useMemo(() => {
    const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

    return Option.match(practitionerIdMaybe, {
      onSome: (practitionerId) =>
        clinicalDataRepositoryService.stream.Practitioner.pipe(
          StreamEither.mapEffect((repo) => repo.get(practitionerId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(
            new UnhandledError({ message: 'Practitioner ID not found' })
          )
        ),
    })
  }, [clinicalDataRepositoryService, params.practitionerId])

  const practitionerPromise = useEitherStream(practitionerStream)

  const navigate = useNavigate()

  const breadcrumbs = useMemo(
    () => [
      { label: 'Practitioners', href: '/Practitioner' },
      practitionerPromise.then((p) => ({
        label: getPractitionerDisplayName(p),
        href: `/Practitioner/${params.practitionerId}`,
      })),
      { label: 'Edit' },
    ],
    [practitionerPromise, params.practitionerId]
  )

  useBreadcrumbs(breadcrumbs)

  const initialValues: Promise<PractitionerFormData> = useMemo(
    () =>
      practitionerPromise.then((practitioner) => ({
        givenName: practitioner.name?.[0]?.given?.[0] ?? '',
        familyName: practitioner.name?.[0]?.family ?? '',
        gender: practitioner.gender ?? undefined,
        qualification: practitioner.qualification?.[0]?.code?.text ?? undefined,
      })),
    [practitionerPromise]
  )

  const handleSubmit = async (formData: PractitionerFormData) => {
    const practitioner = await practitionerPromise

    await Effect.runPromise(
      updatePractitioner(practitioner.id, practitioner, formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
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
