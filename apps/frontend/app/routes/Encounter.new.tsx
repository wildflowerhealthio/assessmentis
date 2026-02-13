import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import { createEncounter } from 'app/modules/resources/Encounter/actions/createEncounter'
import type { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'
import { DateTime, Effect, Schema } from 'effect'
import {
  QuestionnaireId,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import {
  EncounterRepository,
  LocationRepository,
} from '@assessmentis/clinical-domain/administration'
import { usePlatformContext } from '../layers/PlatformContext'
import { VideoCallClient } from '@assessmentis/video-call-domain'

const decodeQuestionnaireId = Schema.decodeUnknownSync(QuestionnaireId)

// Provide default values to prevent uncontrolled input warnings
const defaultValues: Promise<typeof EncounterFormSchema.Encoded> =
  Promise.resolve({
    patientId: undefined,
    practitionerIds: undefined,
    questionnaireIds: [],
    periodStart: undefined,
    periodEnd: undefined,
    locationId: undefined,
  })

export default function CreateEncounterPage() {
  const { clinicalDataRepositoryService, VideoCallClientService } =
    usePlatformContext()
  const navigate = useNavigate()

  useBreadcrumbs([
    { label: 'Encounters', href: '/Encounter' },
    { label: 'New' },
  ])

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    const encounter = await Effect.runPromise(
      createEncounter({
        subject: data.patientId
          ? { reference: `Patient/${data.patientId}` }
          : undefined,
        participant: data.practitionerIds?.map((id) => ({
          individual: { reference: `Practitioner/${id}` },
        })),
        period:
          data.periodStart || data.periodEnd
            ? {
                start: data.periodStart?.pipe(DateTime.toUtc),
                end: data.periodEnd?.pipe(DateTime.toUtc),
              }
            : undefined,
        // User-selected physical location (video room is created by createEncounter)
        location: data.locationId
          ? [
              {
                location: { reference: `Location/${data.locationId}` },
              },
            ]
          : undefined,
        questionnaireResponses: data.questionnaireIds.map((id) => ({
          questionnaire: decodeQuestionnaireId(id),
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
          VideoCallClient,
          VideoCallClientService.client
        ),
        Effect.provideServiceEffect(
          LocationRepository,
          clinicalDataRepositoryService.effect.Location
        )
      )
    )

    // Navigate to the created encounter
    navigate(`/Encounter/${encounter.id}`)
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
