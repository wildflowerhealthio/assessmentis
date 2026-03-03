import { Effect, Either, Option, Schema, DateTime, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { useNavigate } from 'react-router'
import { runEffectSyncFlat } from 'app/runEffectSync'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import { updateEncounter } from 'app/modules/resources/Encounter/actions/updateEncounter'
import type { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'
import { EncounterRepository } from '@assessmentis/clinical-domain/repositories'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Encounter.$id.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import type {
  EncounterParticipant,
  EncounterLocation,
} from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'

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
