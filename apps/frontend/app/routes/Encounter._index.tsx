import { Effect, ManagedRuntime, Schema } from 'effect'
import {
  Encounter,
  EncounterId,
  EncounterRepository,
} from '@assessmentis/domain/encounters'
import { QuestionnaireId } from '@assessmentis/domain/questionnaires'
import { QuestionnaireRepository } from '@assessmentis/domain/questionnaires'
import { createEncounter } from 'app/modules/encounters/actions/createEncounter'
import QuestionnaireSelect from 'app/modules/questionnaire/features/QuestionnaireSelect/QuestionnaireSelect'
import { Form, useNavigate } from 'react-router'
import { clientAppLayer, useRuntimeContext } from 'app/clientRuntime'
import EncountersList from './Encounter/EncountersList'
import type { Route } from './+types/Encounter._index'
import { useCollection } from '@assessmentis/react-util'
import { useEffect } from 'react'

const decodeQuestionnaireId = Schema.decodeUnknownSync(QuestionnaireId)

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = ManagedRuntime.make(clientAppLayer)
  const encounters = await runtime.runPromise(
    Effect.gen(function* () {
      const encounterRepository = yield* EncounterRepository
      //yield* Effect.fail("Error");

      return yield* encounterRepository.getEncounters({})
    })
  )

  const questionnaires = await runtime.runPromise(
    Effect.gen(function* () {
      const questionnaireRepository = yield* QuestionnaireRepository
      return yield* questionnaireRepository.getQuestionnaires({})
    })
  )

  return { encounters, questionnaires }
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  console.log('Creating encounter')
  const event = await request.formData()

  const runtime = ManagedRuntime.make(clientAppLayer)
  const encounter = runtime.runPromise(
    createEncounter({
      questionnaireResponses: [
        {
          questionnaire: decodeQuestionnaireId(event.get('questionnaireId')),
        },
      ],
    })
  )
  return await encounter
}

const useEncounters = (initial: Encounter[]) => {
  const clientRuntime = useRuntimeContext()

  return useCollection<EncounterId, Encounter>(
    {
      apiDelete: async (id: EncounterId) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            EncounterRepository.pipe(
              Effect.flatMap((er) => er.deleteEncounter(id))
            ),
          ])
        ),
      apiCreate: async (q: Encounter) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            EncounterRepository.pipe(
              Effect.flatMap((qr) => qr.createEncounter(q))
            ),
          ]).pipe(Effect.map(([, x]) => x))
        ),
    },
    initial
  )
}

export default function EncounterPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigate = useNavigate()
  const { encounters: initialEncounters, questionnaires } = loaderData
  const { collection: encounters, deleteItem: deleteEncounter } =
    useEncounters(initialEncounters)

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
        style={{ display: 'grid', gridColumn: 2, gap: 'var(--space-2)' }}
      >
        <label style={{ gridColumn: 1 }} htmlFor="encounter-questionnaire">
          Select a questionnaire
        </label>

        <QuestionnaireSelect
          className="input-2"
          questionnaires={questionnaires}
          name="questionnaireId"
          id="encounter-questionnaire"
          style={{ gridColumn: 2 }}
        />
        <button
          className="button-2 blue"
          type="submit"
          style={{ gridColumn: 2 }}
        >
          Create
        </button>
      </Form>
    </>
  )
}
