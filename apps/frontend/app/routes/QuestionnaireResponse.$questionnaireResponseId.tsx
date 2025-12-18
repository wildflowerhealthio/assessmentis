import { Schema, Option, Effect, DateTime } from 'effect'
import { UnhandledError } from '@assessmentis/clinical-domain/errors'
import {
  firstItemAnsweredAfter,
  Questionnaire,
  QuestionnaireItemLink,
  QuestionnaireResponse,
  QuestionnaireId,
  QuestionnaireResponseId,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'

import { getRuntime, useRuntimeContext } from 'app/clientRuntime'
import type { Route } from './+types/QuestionnaireResponse.$questionnaireResponseId'
import QuestionnaireForm from 'app/modules/questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import { updateEncounterRecordingsAndTranscripts } from '../modules/encounters/actions/updateEncounterRecordingsAndTranscripts'
import { getEncounterRecordings } from '../modules/encounters/actions/getEncounterRecordings'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import {
  Media,
  MediaId,
  MediaRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { useClinicalDataCollection } from '../hooks/useClinicalDataCollection'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import SplitPane from '../components/SplitPane/SplitPane'

const tryDecodeQuestionnaireResponseId = Schema.decodeOption(
  QuestionnaireResponseId
)

export const QuestionnaireResponseWithQuestionnaire = Schema.Struct({
  questionnaireResponse: QuestionnaireResponse,
  questionnaire: Questionnaire,
  recordings: Schema.Array(Media),
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

    const recordings = encounterId
      ? yield* getEncounterRecordings(EncounterId.make(encounterId))
      : []

    const questionnaire = yield* questionnaireRepository.get(questionnaireId)
    const enc = Schema.encode(QuestionnaireResponseWithQuestionnaire)({
      questionnaireResponse,
      questionnaire,
      recordings,
    })
    return yield* enc
  })

  return await runtime.runPromise(questionnaireResponseEffect)
}

export default function QuestionnaireResponseDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const runtime = useRuntimeContext()
  const navigate = useNavigate()
  const [highlightLinks, setHighlightLinks] = useState<
    Set<QuestionnaireItemLink>
  >(new Set())
  const { questionnaire, questionnaireResponse, recordings } =
    Schema.decodeSync(QuestionnaireResponseWithQuestionnaire)(loaderData)

  const { collection: media, deleteItem: deleteMedia } =
    useClinicalDataCollection<
      MediaId,
      Media,
      MediaRepository,
      typeof MediaRepository
    >(MediaRepository, recordings)

  const syncVideo = (() => {
    const encounterIdStr =
      questionnaireResponse.encounter?.reference?.split('/')[1] ?? undefined
    if (!encounterIdStr) return undefined
    const encounterId = EncounterId.make(encounterIdStr)
    if (!runtime) return undefined

    return () =>
      runtime
        .runPromise(updateEncounterRecordingsAndTranscripts(encounterId))
        .then(() => navigate(0))
  })()

  return (
    <SplitPane
      left={
        <div style={{ overflowY: 'scroll' }}>
          <QuestionnaireForm
            questionnaire={questionnaire}
            questionnaireResponse={questionnaireResponse}
            highlightLinks={highlightLinks}
          />
        </div>
      }
      right={
        <div style={{ overflowY: 'scroll' }}>
          <h3
            className="heading-3"
            style={{
              display: 'inline-flex',
              width: '100%',
              marginTop: 'var(--space-2)',
              marginBottom: 'var(--space-5)',
            }}
          >
            Recordings:
            <button
              className="button-1"
              style={{
                display: 'inline-block',
                marginTop: 'auto',
                marginBottom: 'auto',
                marginLeft: 'auto',
              }}
              onClick={syncVideo}
              disabled={!syncVideo}
            >
              Refresh
            </button>
          </h3>
          {media.map(({ data }) => (
            <>
              <video
                style={{ width: '100%', aspectRatio: 'calc(16/9)' }}
                onTimeUpdate={(e) => {
                  if (data.createdDateTime) {
                    const videoTime = DateTime.add(data.createdDateTime, {
                      seconds: e.currentTarget.currentTime,
                    })
                    const nextAnswer = firstItemAnsweredAfter(
                      questionnaireResponse,
                      videoTime
                    )

                    setHighlightLinks(
                      nextAnswer ? new Set([nextAnswer.linkId]) : new Set()
                    )
                  }
                }}
                controls
              >
                <source src={data.content.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <button
                className="element-button button-1 filled accent-red"
                style={{
                  marginTop: 'var(--space-1)',
                  marginBottom: 'var(--space-5)',
                  width: '100%',
                }}
                onClick={() => deleteMedia(data.id)}
              >
                Delete
              </button>
            </>
          ))}
        </div>
      }
    />
  )
}
