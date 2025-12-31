import { Effect, Option, Schema, DateTime } from 'effect'
import { useNavigate } from 'react-router'
import {
  runEffectSync,
  useLoadedRuntimeContext,
  useResourceRunEffect,
} from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import { updateEncounter } from 'app/modules/resources/Encounter/actions/updateEncounter'
import { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'
import {
  EncounterId,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import { NotFoundError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Encounter.$encounterId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import {
  extractReferenceId,
  extractReferenceIds,
} from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

const tryDecodeEncounterId = Schema.decodeOption(EncounterId)

export default function EditEncounterPage({ params }: Route.ComponentProps) {
  const encounterLoader = useResourceRunEffect(
    useMemo(() => {
      const encounterIdMaybe = tryDecodeEncounterId(params.encounterId)

      return Effect.gen(function* () {
        const repository = yield* EncounterRepository

        const encounterId = yield* encounterIdMaybe.pipe(
          Option.map(Effect.succeed),
          Option.getOrElse(() =>
            Effect.fail(
              new NotFoundError({
                resourceType: 'Encounter',
                params: { id: params.encounterId },
              })
            )
          )
        )

        return yield* repository.get(encounterId)
      })
    }, [params.encounterId])
  )

  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  useBreadcrumbs([
    { label: 'Encounters', href: '/Encounter' },
    {
      loading: encounterLoader._tag === 'loading',
      label:
        encounterLoader._tag === 'loaded'
          ? runEffectSync(getEncounterDisplayName(encounterLoader.value))
          : 'Unknown Encounter',
      href: `/Encounter/${params.encounterId}`,
    },
    { label: 'Edit' },
  ])

  if (encounterLoader._tag == 'loading') {
    return (
      <FormPage title="Edit Encounter">
        <Skeleton count={5} height={40} style={{ marginBottom: '1rem' }} />
      </FormPage>
    )
  }
  if (encounterLoader._tag === 'error') {
    throw encounterLoader.error
  }

  const encounter = encounterLoader.value

  // Extract participant practitioner IDs
  const practitionerIds = extractReferenceIds(
    encounter.participant
      ?.filter(
        (p): p is { individual: { reference: string } } =>
          p.individual?.reference?.startsWith('Practitioner/') ?? false
      )
      .map((p) => p.individual) ?? []
  )

  // Extract location display (first location's display or identifier value)
  const locationDisplay =
    encounter.location?.[0]?.location?.display ||
    encounter.location?.[0]?.location?.identifier?.value

  const initialValues: typeof EncounterFormSchema.Encoded = {
    patientId: extractReferenceId(encounter.subject),
    practitionerIds,
    questionnaireIds: [] as ReadonlyArray<string>, // Would need to query related QuestionnaireResponses
    periodStart: encounter.period?.start?.pipe(
      DateTime.setZone(DateTime.zoneMakeLocal())
    ),
    periodEnd: encounter.period?.end?.pipe(
      DateTime.setZone(DateTime.zoneMakeLocal())
    ),
    locationDisplay,
  }

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    if (!encounter.id) return

    if (clientRuntime._tag != 'loaded') {
      console.error('Runtime not loaded', clientRuntime)
      return
    }

    await clientRuntime.value.runPromise(
      updateEncounter(encounter.id, encounter, data)
    )

    // Redirect back to detail page
    navigate(`/Encounter/${encounter.id}`)
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
