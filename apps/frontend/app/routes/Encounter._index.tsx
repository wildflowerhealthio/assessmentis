import { Effect, Schema } from 'effect'
import {
  Encounter,
  EncounterId,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import { QuestionnaireId } from '@assessmentis/clinical-domain/content-management'
import { QuestionnaireRepository } from '@assessmentis/clinical-domain/content-management'
import { createEncounter } from 'app/modules/resources/Encounter/actions/createEncounter'
import { Form, useNavigate } from 'react-router'
import EncountersList from '../modules/resources/Encounter/components/EncountersList'
import type { Route } from './+types/Encounter._index'
import { useEffect, useState } from 'react'
import { getRuntime } from '../clientRuntime'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'
import { PatientPicker } from '../modules/resources/Patient/components/PatientPicker'
import { PractitionerPicker } from '../modules/resources/Practitioner/components/PractitionerPicker'
import { QuestionnairePicker } from '../modules/resources/Questionnaire/components/QuestionnairePicker/QuestionnairePicker'

const decodeQuestionnaireId = Schema.decodeUnknownSync(QuestionnaireId)

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const encounters = await runtime.runPromise(
    Effect.gen(function* () {
      const encounterRepository = yield* EncounterRepository
      //yield* Effect.fail("Error");

      return yield* encounterRepository.getMany()
    })
  )

  const questionnaires = await runtime.runPromise(
    Effect.gen(function* () {
      const questionnaireRepository = yield* QuestionnaireRepository
      return yield* questionnaireRepository.getMany()
    })
  )

  return { encounters, questionnaires }
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  console.log('Creating encounter')
  const event = await request.formData()

  const runtime = await getRuntime()

  const questionnaireIdsStr = event.get('questionnaireIds')?.toString()

  const questionnaireIds = questionnaireIdsStr
    ? JSON.parse(questionnaireIdsStr)
    : []

  // Note: Patient and practitioner pickers are shown in the UI but their values
  // are not yet used because createEncounter schema doesn't support subject/participant fields
  const encounter = runtime.runPromise(
    createEncounter({
      questionnaireResponses: questionnaireIds.map((id: string) => ({
        questionnaire: decodeQuestionnaireId(id),
      })),
    })
  )
  return await encounter
}

const useEncounters = (initial: Encounter[]) => {
  return useClinicalDataCollection<
    EncounterId,
    Encounter,
    EncounterRepository,
    typeof EncounterRepository
  >(EncounterRepository, initial)
}

export default function EncounterPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigate = useNavigate()
  const { encounters: initialEncounters } = loaderData
  const { collection: encounters, deleteItem: deleteEncounter } =
    useEncounters(initialEncounters)

  const [selectedPatientId, setSelectedPatientId] = useState<
    string | undefined
  >()
  const [selectedPractitionerIds, setSelectedPractitionerIds] = useState(
    [] as ReadonlyArray<string>
  )
  const [selectedQuestionnaireIds, setSelectedQuestionnaireIds] = useState(
    [] as ReadonlyArray<string>
  )

  useEffect(() => {
    if (actionData?.id) navigate(`/Encounter/${actionData.id}`)
  }, [actionData, navigate])

  return (
    <>
      <h2 className="heading-3">Join an encounter</h2>
      <EncountersList
        deleteEncounter={deleteEncounter}
        encounters={encounters}
      />
      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new encounter
      </h2>

      <Form
        method="post"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          maxWidth: '600px',
          marginTop: 'var(--space-4)',
        }}
      >
        <PatientPicker
          picking={{
            value: selectedPatientId,
            onChange: (id: string | undefined) => setSelectedPatientId(id),
            multiple: false,
          }}
          label="Patient (Subject)"
          placeholder="Select the patient for this encounter..."
        />
        <input type="hidden" name="patientId" value={selectedPatientId || ''} />

        <PractitionerPicker
          picking={{
            value: selectedPractitionerIds,
            onChange: (ids: ReadonlyArray<string> | undefined) =>
              setSelectedPractitionerIds(ids ?? []),
            multiple: true as const,
          }}
          label="Practitioners (Participants)"
          placeholder="Select practitioner(s)..."
        />
        <input
          type="hidden"
          name="practitionerIds"
          value={JSON.stringify(selectedPractitionerIds)}
        />

        <QuestionnairePicker
          picking={{
            value: selectedQuestionnaireIds,
            onChange: (ids: ReadonlyArray<string> | undefined) =>
              setSelectedQuestionnaireIds(ids ?? []),
            multiple: true,
          }}
          immediate
          label="Questionnaires"
          placeholder="Select questionnaire(s)..."
          required
        />
        <input
          type="hidden"
          name="questionnaireIds"
          value={JSON.stringify(selectedQuestionnaireIds)}
        />

        <button
          className="button-2 blue"
          type="submit"
          disabled={selectedQuestionnaireIds.length === 0}
        >
          Create Encounter
        </button>
      </Form>
    </>
  )
}
