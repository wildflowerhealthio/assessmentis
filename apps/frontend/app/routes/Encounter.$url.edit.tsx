import { DateTime, Effect } from 'effect'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import { ClinicalDomainHub, Encounter } from '@assessmentis/clinical-domain'
import type { EncounterLocation, EncounterParticipant } from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { useEitherStream } from '@assessmentis/react-util'

import { FormPage } from '@/modules/common/components/FormPage/form-page'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/encounter'
import '../traits/Link/implementations/encounter'
/* eslint-enable import/no-unassigned-import */

import { useBreadcrumbs } from '@/modules/Breadcrumbs/use-breadcrumbs'
import { updateEncounter } from '@/modules/resources/Encounter/actions/update-encounter'
import { EncounterForm } from '@/modules/resources/Encounter/components/encounter-form'
import type { EncounterFormSchema } from '@/modules/resources/Encounter/schemas/encounter-form-schema'

import { useHub } from '../layers/use-hub'
import { useResourceSubscription } from '../layers/use-resource-subscription'
import type { Route } from './+types/Encounter.$url.edit'

export default function EditEncounterPage({ params }: Route.ComponentProps): React.JSX.Element {
  const hub = useHub()

  const encounterStream = useResourceSubscription(Encounter, params.url)

  const encounterPromise = useEitherStream(encounterStream)

  const navigate = useNavigate()

  useBreadcrumbs(() => [Encounter, encounterPromise, 'Edit'], [encounterPromise])

  const initialValues: Promise<typeof EncounterFormSchema.Encoded> = useMemo(
    () =>
      encounterPromise.then((encounter) => {
        // Extract participant practitioner URLs
        const practitionerUrls =
          encounter.participant
            ?.filter(
              (p: EncounterParticipant) =>
                p.individual?.reference?.includes('Practitioner/') ?? false
            )
            // TODO: add a more portable version of provider detection
            .map((p: EncounterParticipant) => p.individual?.reference)
            .filter((ref: string | undefined): ref is string => ref !== undefined) ?? []

        // Extract user-selected location URL (non-virtual location entry)
        const userLocation = encounter.location?.find(
          (loc: EncounterLocation) =>
            !loc.physicalType?.coding?.some((coding) => coding.code === 'vi')
        )
        const locationUrl = userLocation?.location.reference

        return {
          patientUrl: encounter.subject?.reference,
          practitionerUrls,
          // Would need to query related QuestionnaireResponses
          questionnaireUrls: [] as readonly never[],
          periodStart: encounter.period?.start?.pipe(DateTime.setZone(DateTime.zoneMakeLocal())),
          periodEnd: encounter.period?.end?.pipe(DateTime.setZone(DateTime.zoneMakeLocal())),
          locationUrl,
        }
      }),
    [encounterPromise]
  )

  const handleSubmit = async (data: typeof EncounterFormSchema.Type): Promise<void> => {
    const encounter = await encounterPromise
    if (!Resource.hasResourceUrl(encounter)) {
      return
    }

    await Effect.runPromise(
      updateEncounter(encounter, data).pipe(Effect.provideService(ClinicalDomainHub, hub))
    )

    void navigate(encounter.Link)
  }

  return (
    <FormPage title="Edit Encounter">
      <div
        style={{
          backgroundColor: 'var(--color-warning-bg)',
          borderRadius: 'var(--radius-2)',
          marginBottom: 'var(--space-4)',
          padding: 'var(--space-4)',
        }}
      >
        <p>
          <strong>Note:</strong> You can update the patient, practitioners, period, and location.
          Changing questionnaires requires more complex operations and is not supported.
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
