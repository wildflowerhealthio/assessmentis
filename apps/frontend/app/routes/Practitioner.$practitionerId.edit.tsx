import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PractitionerForm } from 'app/modules/resources/Practitioner/components/PractitionerForm'
import { updatePractitioner } from 'app/modules/resources/Practitioner/actions/updatePractitioner'
import { PractitionerFormData } from 'app/modules/resources/Practitioner/schemas/PractitionerFormSchema'
import {
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/Practitioner.$practitionerId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getPractitionerDisplayName } from '../modules/resources/Practitioner/utils/practitionerDisplay'
import { useMemo } from 'react'
import { useEffectTs } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

const tryDecodePractitionerId = Schema.decodeOption(PractitionerId)

export default function EditPractitionerPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const practitionerEffect = useMemo(() => {
    const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

    return Effect.gen(function* () {
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
    }).pipe(
      Effect.provideServiceEffect(
        PractitionerRepository,
        clinicalDataRepositoryService.Practitioner
      )
    )
  }, [clinicalDataRepositoryService.Practitioner, params.practitionerId])

  const practitionerPromise = useEffectTs(practitionerEffect)

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
