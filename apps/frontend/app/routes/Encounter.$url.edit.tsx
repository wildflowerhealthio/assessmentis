import { DateTime, Effect } from 'effect'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import {
  ClinicalDomainHub,
  Encounter,
  type EncounterLocation,
  type EncounterParticipant,
} from '@assessmentis/clinical-domain'
import { Resource } from '@assessmentis/effectful-store'
import { useEitherStream } from '@assessmentis/react-util'

import { FormPage } from 'app/modules/common/components/FormPage/FormPage'

import 'app/traits/BreadcrumbLabel/implementations/Encounter'
import 'app/traits/Link/implementations/Encounter'

import { useBreadcrumbs } from 'app/modules/Breadcrumbs/useBreadcrumbs'
import { updateEncounter } from 'app/modules/resources/Encounter/actions/updateEncounter'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import type { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'

import { useHub } from '../layers/useHub'
import { useResourceSubscription } from '../layers/useResourceSubscription'
import type { Route } from './+types/Encounter.$url.edit'

export default function EditEncounterPage({ params }: Route.ComponentProps) {
  const hub = useHub()

  const encounterStream = useResourceSubscription(Encounter, params.url)

  const encounterPromise = useEitherStream(encounterStream)

  const navigate = useNavigate()

  useBreadcrumbs(
    () => [Encounter, encounterPromise, 'Edit'],
    [encounterPromise]
  )

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
            .filter(
              (ref: string | undefined): ref is string => ref !== undefined
            ) ?? []

        // Extract user-selected location URL (non-virtual location entry)
        const userLocation = encounter.location?.find(
          (loc: EncounterLocation) =>
            !loc.physicalType?.coding?.some((coding) => coding.code === 'vi')
        )
        const locationUrl = userLocation?.location.reference

        return {
          patientUrl: encounter.subject?.reference,
          practitionerUrls,
          questionnaireUrls: [] as ReadonlyArray<never>, // Would need to query related QuestionnaireResponses
          periodStart: encounter.period?.start?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
          periodEnd: encounter.period?.end?.pipe(
            DateTime.setZone(DateTime.zoneMakeLocal())
          ),
          locationUrl,
        }
      }),
    [encounterPromise]
  )

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    const encounter = await encounterPromise
    if (!Resource.hasResourceUrl(encounter)) return

    await Effect.runPromise(
      updateEncounter(encounter, data).pipe(
        Effect.provideService(ClinicalDomainHub, hub)
      )
    )

    navigate(encounter.Link)
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
