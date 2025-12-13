import { Schema, Option, Effect } from 'effect'
import {
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain/questionnaires'
import { UnhandledError } from '@assessmentis/clinical-domain/errors'
import { QuestionnaireId } from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireResponseId } from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireRepository } from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireResponseRepository } from '@assessmentis/clinical-domain/questionnaires'
import { getRuntime } from 'app/clientRuntime'
import type { Route } from './+types/QuestionnaireResponse.$questionnaireResponseId'
import QuestionnaireForm from 'app/modules/questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import { updateEncounterRecordingsAndTranscripts } from '../modules/encounters/actions/updateEncounterRecordingsAndTranscripts'
import {
  Encounter,
  EncounterId,
  getRecordingFileUrls,
} from '@assessmentis/clinical-domain/encounters'

const tryDecodeQuestionnaireResponseId = Schema.decodeOption(
  QuestionnaireResponseId
)

export const QuestionnaireResponseWithQuestionnaire = Schema.Struct({
  questionnaireResponse: QuestionnaireResponse,
  questionnaire: Questionnaire,
  encounter: Schema.optional(Encounter),
})

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()

  const questionnaireResponseIdStr = params.questionnaireResponseId

  const questionnaireResponseIdMaybe = tryDecodeQuestionnaireResponseId(
    questionnaireResponseIdStr
  )

  const questionnaireResponseEffect = Effect.gen(function* () {
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const questionnaireRepository = yield* QuestionnaireRepository

    const questionnaireResponseId = yield* questionnaireResponseIdMaybe.pipe(
      Option.map((questionnaireResponseId) =>
        Effect.succeed(questionnaireResponseId)
      ),
      Option.getOrElse(() =>
        Effect.fail(
          new UnhandledError({ cause: 'Questionnaire Response not found' })
        )
      )
    )
    const questionnaireResponse = yield* questionnaireResponseRepository.get(
      questionnaireResponseId
    )

    const questionnaireId = QuestionnaireId.make(
      questionnaireResponse.questionnaire?.split('/')[3] ??
        questionnaireResponse.questionnaire ??
        ''
    )
    const encounterId =
      questionnaireResponse.encounter?.reference?.split('/')[1] ?? undefined
    const encounter = encounterId
      ? yield* updateEncounterRecordingsAndTranscripts(
          EncounterId.make(encounterId)
        )
      : undefined

    const questionnaire = yield* questionnaireRepository.get(questionnaireId)
    const enc = Schema.encode(QuestionnaireResponseWithQuestionnaire)({
      questionnaireResponse,
      questionnaire,
      encounter,
    })
    return yield* enc
  })

  return await runtime.runPromise(questionnaireResponseEffect)
}

const decodeQuestionnaire = Schema.decodeSync(Questionnaire)
const decodeQuestionnaireResponse = Schema.decodeSync(QuestionnaireResponse)

export default function QuestionnaireResponseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { questionnaire, questionnaireResponse, encounter } = loaderData
  // const handleSubmitAnswer = async (
  //   questionnaireItemLink: QuestionnaireItemLink,
  //   answer: QuestionnaireResponseItemAnswer | null,
  // ): Promise<unknown> => {
  //   const runtime = await getRuntime();
  //   return await runtime.runPromise(
  //     submitAnswer(questionnaireItemLink, answer),
  //   );
  // };

  // This hook builds the form based on the questionnaire
  return (
    <section style={{ maxWidth: 800, margin: 'auto' }}>
      {encounter ? JSON.stringify(getRecordingFileUrls(encounter)) : undefined}
      <QuestionnaireForm
        questionnaire={decodeQuestionnaire(questionnaire)}
        questionnaireResponse={decodeQuestionnaireResponse(
          questionnaireResponse
        )}
      />
    </section>
  )
}
