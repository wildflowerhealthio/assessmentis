import { Effect } from 'effect'
import { QuestionnairesList } from './Questionnaire/QuestionnairesList'
import {
  Questionnaire,
  QuestionnaireId,
  QuestionnaireRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import questionnaireTemplates from 'app/modules/admin/questionnaire-templates/questionnaireTemplates'
import { useRuntimeContext } from 'app/clientRuntime'
import type { Route } from './+types/Questionnaire._index'
import { useCollection } from '@assessmentis/react-util'
import { getRuntime } from '../clientRuntime'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()

  const questionnaires = await runtime.runPromise(
    Effect.gen(function* () {
      const questionnaireRepository = yield* QuestionnaireRepository
      return yield* questionnaireRepository.getMany({})
    })
  )

  return { questionnaires }
}

const useQuestionnaires = (initial: Questionnaire[]) => {
  const clientRuntime = useRuntimeContext()
  console.log('clientRuntime', clientRuntime)

  return useCollection<QuestionnaireId, Questionnaire>(
    {
      apiDelete: async (id: QuestionnaireId) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            QuestionnaireRepository.pipe(Effect.flatMap((qr) => qr.delete(id))),
          ])
        ),
      apiCreate: async (q: Questionnaire) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            QuestionnaireRepository.pipe(Effect.flatMap((qr) => qr.create(q))),
          ]).pipe(Effect.map(([, x]) => x))
        ),
    },
    initial
  )
}

export default function QuestionnairePage({
  loaderData,
}: Route.ComponentProps) {
  const {
    collection: questionnaires,
    deleteItem: deleteQuestionnaire,
    createItem: createQuestionnaire,
  } = useQuestionnaires(loaderData.questionnaires)

  const loadTemplateByTitleForm = async function (formData: FormData) {
    const templateToCreate = questionnaireTemplates.find(
      (t) => t.title == formData.get('title')
    )
    if (templateToCreate) return await createQuestionnaire(templateToCreate)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 className="heading-3">Questionnaires</h2>
      <QuestionnairesList
        deleteQuestionnaire={deleteQuestionnaire}
        questionnaires={questionnaires}
      />
      <a
        href={`https://smartforms.csiro.au/launch?launch=xyz123&iss=${encodeURIComponent(
          'https://healthcare.googleapis.com/v1/projects/assessment-is-sandbox/locations/northamerica-northeast2/datasets/Sandbox/fhirStores/fhir-store/fhir'
        )}`}
      >
        <h2 className="heading-3">Edit Questionnaires</h2>
      </a>
      <h2 className="heading-3">Questionnaire Template Loader</h2>
      <div className="subheading-4">Click buttons to load templates</div>
      {questionnaireTemplates.map(({ title }) => {
        return (
          <form key={title} action={loadTemplateByTitleForm}>
            <input hidden name="title" defaultValue={title} />
            <button className="button-2" type="submit">
              {title}
            </button>
          </form>
        )
      })}
    </div>
  )
}
