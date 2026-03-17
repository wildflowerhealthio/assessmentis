import { DateTime, Effect } from 'effect'
import { useNavigate } from 'react-router'

import {
  ClinicalDomainHub,
  Encounter,
  EncounterLocation,
  EncounterParticipant,
} from '@assessmentis/clinical-domain'
import { Period, Reference } from '@assessmentis/clinical-domain/data-types'

import { FormPage } from 'app/modules/common/components/FormPage/FormPage'

import 'app/traits/BreadcrumbLabel/implementations/Encounter'
import 'app/traits/Link/implementations/Encounter'

import { useBreadcrumbs } from 'app/modules/Breadcrumbs/useBreadcrumbs'
import { createEncounter } from 'app/modules/resources/Encounter/actions/createEncounter'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import type { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'

import { useHub } from '../layers/useHub'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<typeof EncounterFormSchema.Encoded> =
  Promise.resolve({
    patientUrl: undefined,
    practitionerUrls: undefined,
    questionnaireUrls: [],
    periodStart: undefined,
    periodEnd: undefined,
    locationUrl: undefined,
  })

export default function CreateEncounterPage() {
  const hub = useHub()
  const navigate = useNavigate()

  useBreadcrumbs(() => [Encounter, 'New'], [])

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    const encounter = await Effect.runPromise(
      createEncounter({
        encounter: {
          subject: data.patientUrl
            ? Reference.make({
                reference: data.patientUrl.toString(),
                type: 'Patient',
              })
            : undefined,
          participant: data.practitionerUrls?.map((id) =>
            EncounterParticipant.make({
              individual: Reference.make({
                reference: `Practitioner/${id}`,
              }),
            })
          ),
          period:
            data.periodStart || data.periodEnd
              ? Period.make({
                  start: data.periodStart?.pipe(DateTime.toUtc),
                  end: data.periodEnd?.pipe(DateTime.toUtc),
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

    navigate(encounter.Link)
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
