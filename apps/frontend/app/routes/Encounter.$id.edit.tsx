import { Effect, Either, Option, Schema, DateTime, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
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
import {
  extractReferenceId,
  extractReferenceIds,
} from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import type { EncounterParticipant, EncounterLocation } from '@assessmentis/clinical-domain'
import type { IdentifierAndReference } from '@assessmentis/clinical-domain/data-types'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'

const tryDecodeEncounterId = Schema.decodeOption(Schema.String)

export default function EditEncounterPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const encounterStream = useMemo(() => {
    const encounterIdMaybe = tryDecodeEncounterId(params.id)

    return Option.match(encounterIdMaybe, {
      onSome: (encounterId) =>
        clinicalDataRepositoryService.stream.Encounter.pipe(
          StreamEither.mapEffect((repo) => repo.get(encounterId))
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
        const practitionerIds = extractReferenceIds(
          encounter.participant
            ?.filter(
              (p: EncounterParticipant) =>
                p.individual?.reference?.startsWith('Practitioner/') ?? false
            )
            .map((p: EncounterParticipant) => p.individual)
            .filter(
              (ref: IdentifierAndReference.Reference | undefined): ref is IdentifierAndReference.Reference => ref !== undefined
            ) ?? []
        )

        // Extract user-selected location ID (non-virtual location entry)
        const userLocation = encounter.location?.find(
          (loc: EncounterLocation) =>
            !loc.physicalType?.coding?.some((coding) => coding.code === 'vi')
        )
        const locationId = extractReferenceId(userLocation?.location)

        return {
          patientId: extractReferenceId(encounter.subject),
          practitionerIds,
          questionnaireIds: [] as ReadonlyArray<string>, // Would need to query related QuestionnaireResponses
          periodStart: encounter.period?.start?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
          periodEnd: encounter.period?.end?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
          locationId,
        }
      }),
    [encounterPromise]
  )

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    const encounter = await encounterPromise

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
