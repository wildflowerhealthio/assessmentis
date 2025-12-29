import { useNavigate } from 'react-router'
import { useRuntimeContext } from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { EncounterForm } from 'app/modules/resources/Encounter/components/EncounterForm'
import { createEncounter } from 'app/modules/resources/Encounter/actions/createEncounter'
import { EncounterFormSchema } from 'app/modules/resources/Encounter/schemas/EncounterFormSchema'
import { Schema } from 'effect'
import { QuestionnaireId } from '@assessmentis/clinical-domain/content-management'
import { useBreadcrumbs } from '../modules/global/components/BreadcrumbProvider/BreadcrumbProvider'

const decodeQuestionnaireId = Schema.decodeUnknownSync(QuestionnaireId)

export default function CreateEncounterPage() {
  const navigate = useNavigate()
  const clientRuntime = useRuntimeContext()

  useBreadcrumbs([
    { label: 'Encounters', href: '/Encounter' },
    { label: 'New' },
  ])

  const handleSubmit = async (data: typeof EncounterFormSchema.Type) => {
    const encounter = await clientRuntime.runPromise(
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
                start: data.periodStart,
                end: data.periodEnd,
              }
            : undefined,
        // Note: Location includes video room (set by createEncounter) + optional display name
        questionnaireResponses: data.questionnaireIds.map((id) => ({
          questionnaire: decodeQuestionnaireId(id),
        })),
      })
    )

    // Navigate to the created encounter
    navigate(`/Encounter/${encounter.id}`)
  }

  // Provide default values to prevent uncontrolled input warnings
  const defaultValues: typeof EncounterFormSchema.Encoded = {
    patientId: undefined,
    practitionerIds: undefined,
    questionnaireIds: [],
    periodStart: undefined,
    periodEnd: undefined,
    locationDisplay: undefined,
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
