import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import { createEncounter } from 'app/modules/resources/Encounter/actions/createEncounter'
import type { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'
import { DateTime, Effect } from 'effect'
import { QuestionnaireResponseRepository } from '@assessmentis/clinical-domain/repositories'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import {
  EncounterRepository,
  LocationRepository,
} from '@assessmentis/clinical-domain/repositories'
import { usePlatformContext } from '../layers/PlatformContext'
import {
  EncounterLocation,
  EncounterParticipant,
} from '@assessmentis/clinical-domain'
import {
  Period,
  Reference,
} from '@assessmentis/clinical-domain/data-types'

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<typeof EncounterFormSchema.Encoded> =
  Promise.resolve({
    patientUrl: undefined,
    practitionerUrls: undefined,
    questionnaireUrls: [],
    periodStart: undefined,
    periodEnd: undefined,
    locationId: undefined,
  })

export default function CreateEncounterPage() {
  const { clinicalDataRepositoryService } = usePlatformContext()
  const navigate = useNavigate()

  useBreadcrumbs([
    { label: 'Encounters', href: '/Encounter' },
    { label: 'New' },
  ])

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
      }).pipe(
        Effect.provideServiceEffect(
          QuestionnaireResponseRepository,
          clinicalDataRepositoryService.effect.QuestionnaireResponse
        ),
        Effect.provideServiceEffect(
          EncounterRepository,
          clinicalDataRepositoryService.effect.Encounter
        ),
        Effect.provideServiceEffect(
          LocationRepository,
          clinicalDataRepositoryService.effect.Location
        )
      )
    )

    // Navigate to the created encounter
    navigate(`/Encounter/${encounter.url?.toString() ?? ''}`)
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
