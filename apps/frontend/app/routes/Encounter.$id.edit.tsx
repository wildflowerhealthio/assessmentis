import { DateTime, Effect, Either, Option, Schema, Stream } from 'effect'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import type {
  EncounterLocation,
  EncounterParticipant,
} from '@assessmentis/clinical-domain'
import { EncounterRepository } from '@assessmentis/clinical-domain/repositories'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'
import { useEitherStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { updateEncounter } from 'app/modules/resources/Encounter/actions/updateEncounter'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import type { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'
import { runEffectSyncFlat } from 'app/runEffectSync'

import { usePlatformContext } from '../layers/PlatformContext'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import type { Route } from './+types/Encounter.$id.edit'

const hasUrl = <T extends { readonly url?: ReadonlyUrl | undefined }>(
  resource: T
): resource is T & { readonly url: NonNullable<T['url']> } =>
  resource.url !== undefined

const tryDecodeEncounterUrl = Schema.decodeOption(ReadonlyUrl.FromString)

export default function EditEncounterPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const encounterStream = useMemo(() => {
    const encounterUrlMaybe = tryDecodeEncounterUrl(params.id)

    return Option.match(encounterUrlMaybe, {
      onSome: (encounterUrl) =>
        clinicalDataRepositoryService.stream.Encounter.pipe(
          StreamEither.mapEffect((repo) => repo.get(encounterUrl))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(new UnhandledError({ message: 'Encounter ID not found' }))
        ),
    })
  }, [clinicalDataRepositoryService, params.id])

  const encounterPromise = useEitherStream(encounterStream)

  const navigate = useNavigate()

  const breadcrumbs = useMemo(
    () => [
      { label: 'Encounters', href: '/Encounter' },
      encounterPromise.then((e) => ({
        label: runEffectSyncFlat(getEncounterDisplayName(e)),
        href: `/Encounter/${params.id}`,
      })),
      { label: 'Edit' },
    ],
    [encounterPromise, params.id]
  )

  useBreadcrumbs(breadcrumbs)

  const initialValues: Promise<typeof EncounterFormSchema.Encoded> = useMemo(
    () =>
      encounterPromise.then((encounter) => {
        // Extract participant practitioner IDs
        const practitionerUrls =
          encounter.participant
            ?.filter(
              (p: EncounterParticipant) =>
                p.individual?.reference?.includes('Practitioner/') ?? false
            )
            .map((p: EncounterParticipant) => p.individual?.reference)
            .filter(
              (ref: string | undefined): ref is string => ref !== undefined
            ) ?? []

        // Extract user-selected location ID (non-virtual location entry)
        const userLocation = encounter.location?.find(
          (loc: EncounterLocation) =>
            !loc.physicalType?.coding?.some((coding) => coding.code === 'vi')
        )
        const locationUrl = userLocation?.location.reference

        return {
          patientId: extractReferenceId(encounter.subject),
          practitionerUrls,
          questionnaireUrls: [] as ReadonlyArray<never>, // Would need to query related QuestionnaireResponses
          periodStart: encounter.period?.start?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
          periodEnd: encounter.period?.end?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
          locationId: locationUrl,
        }
      }),
    [encounterPromise]
  )

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    const encounter = await encounterPromise
    if (!hasUrl(encounter)) return

    await Effect.runPromise(
      updateEncounter(encounter, data).pipe(
        Effect.provideServiceEffect(
          EncounterRepository,
          clinicalDataRepositoryService.effect.Encounter
        )
      )
    )

    // Redirect back to detail page
    navigate(`/Encounter/${encounter.url?.toString() ?? params.id}`)
  }

  return (
    <FormPage title="Edit Encounter">
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--color-warning-bg)',
          borderRadius: 'var(--radius-2)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <p>
          <strong>Note:</strong> You can update the patient, practitioners,
          period, and location. Changing questionnaires requires more complex
          operations and is not supported.
        </p>
      </div>
      <EncounterForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
