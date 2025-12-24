import { Effect } from 'effect'
import {
  Questionnaire,
  QuestionnaireResponse,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
  QuestionnaireResponseId,
} from '@assessmentis/clinical-domain/content-management'
import { getRuntime, useRuntimeContext } from 'app/clientRuntime'
import type { Route } from './+types/QuestionnaireResponse._index'
import QuestionnaireResponseList from '../modules/questionnaire/components/QuestionnaireResponseList'
import { useCollection } from '@assessmentis/react-util'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const questionnaireResponses = await runtime.runPromise(
    Effect.gen(function* () {
      const questionnaireRepository = yield* QuestionnaireRepository
      const questionnaireResponseRepository =
        yield* QuestionnaireResponseRepository
      const [questionnaires, responses] = yield* Effect.all([
        questionnaireRepository.getMany(),
        questionnaireResponseRepository.getMany(),
      ])
      return responses.map(
        (
          r
        ): QuestionnaireResponse & {
          _questionnaire: Questionnaire | undefined
        } => ({
          ...r,
          _questionnaire:
            questionnaires.find((q) => q.id == r.questionnaire) ?? undefined,
        })
      )
    })
  )
  return { questionnaireResponses }
}

const useQuestionnaireResponse = (
  initial: (QuestionnaireResponse & {
    _questionnaire: Questionnaire | undefined
  })[]
) => {
  const clientRuntime = useRuntimeContext()

  return useCollection<
    QuestionnaireResponseId,
    QuestionnaireResponse & { _questionnaire: Questionnaire | undefined }
  >(
    {
      apiDelete: async (id: QuestionnaireResponseId | undefined) => {
        if (!id) return
        return clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            QuestionnaireResponseRepository.pipe(
              Effect.flatMap((qrr) => qrr.delete(id))
            ),
          ])
        )
      },
      apiCreate: (
        _: QuestionnaireResponse & {
          _questionnaire: Questionnaire | undefined
        }
      ): Promise<
        QuestionnaireResponse & { _questionnaire: Questionnaire | undefined }
      > => Promise.reject('Not implemented'),
    },
    initial
  )
}

export default function QuestionnaireResponsePage({
  loaderData,
}: Route.ComponentProps) {
  const {
    collection: questionnaireResponses,
    deleteItem: deleteQuestionnaireResponse,
  } = useQuestionnaireResponse(loaderData.questionnaireResponses)
  return (
    <>
      <h2 className="heading-3">Edit a Questionnaire Response</h2>
      <QuestionnaireResponseList
        deleteQuestionnaireResponse={deleteQuestionnaireResponse}
        questionnaireResponses={questionnaireResponses}
      />
      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new Questionnaire Response
      </h2>
      <div className="subheading-3">
        Create questionnaire responses by including a questionnaire in an
        encounter
      </div>
    </>
  )
}
