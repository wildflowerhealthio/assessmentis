import { DateTime, Effect } from 'effect'
import { useNavigate } from 'react-router'

import {
  ClinicalDomainHub,
  Encounter,
  EncounterLocation,
  EncounterParticipant,
} from '@assessmentis/clinical-domain'
import { Period, Reference } from '@assessmentis/clinical-domain/data-types'

import { FormPage } from '@/modules/common/components/FormPage/form-page'

import '../traits/BreadcrumbLabel/implementations/encounter'
import '../traits/Link/implementations/encounter'

import { useBreadcrumbs } from '@/modules/Breadcrumbs/use-breadcrumbs'
import { createEncounter } from '@/modules/resources/Encounter/actions/create-encounter'
import { EncounterForm } from '@/modules/resources/Encounter/components/encounter-form'
import type { EncounterFormSchema } from '@/modules/resources/Encounter/schemas/encounter-form-schema'

import { useHub } from '../layers/use-hub'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<typeof EncounterFormSchema.Encoded> = Promise.resolve({
  locationUrl: undefined,
  patientUrl: undefined,
  periodEnd: undefined,
  periodStart: undefined,
  practitionerUrls: undefined,
  questionnaireUrls: [],
})

export default function CreateEncounterPage(): React.JSX.Element {
  const hub = useHub()
  const navigate = useNavigate()

  useBreadcrumbs(() => [Encounter, 'New'], [])

  const handleSubmit = async (data: typeof EncounterFormSchema.Type): Promise<void> => {
    const encounter = await Effect.runPromise(
      createEncounter({
        encounter: {
          subject: data.patientUrl
            ? Reference.make({
                reference: data.patientUrl.toString(),
                type: 'Patient',
              })
            : undefined,
          participant: data.practitionerUrls?.map((url) =>
            EncounterParticipant.make({
              individual: Reference.make({
                reference: url.toString(),
              }),
            })
          ),
          period:
            data.periodStart || data.periodEnd
              ? Period.make({
                  end: data.periodEnd?.pipe(DateTime.toUtc),
                  start: data.periodStart?.pipe(DateTime.toUtc),
                })
              : undefined,
          // User-selected physical location (video room is created by createEncounter)
          location: data.locationUrl
            ? [
                EncounterLocation.make({
                  location: Reference.make({
                    reference: data.locationUrl.toString(),
                    type: 'Location',
                  }),
                }),
              ]
            : undefined,
        },
        questionnaireResponses: data.questionnaireUrls.map((questionnaire) => ({
          questionnaire,
        })),
      }).pipe(Effect.provideService(ClinicalDomainHub, hub))
    )

    void navigate(encounter.Link)
  }

  return (
    <FormPage title="Create New Encounter">
      <EncounterForm
        onSubmit={handleSubmit}
        submitLabel="Create Encounter"
        initialValues={defaultValues}
      />
    </FormPage>
  )
}
