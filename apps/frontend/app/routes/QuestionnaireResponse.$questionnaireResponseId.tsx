import { Suspense, useMemo } from 'react'
import { Schema, Option, Effect, DateTime } from 'effect'
import { UnhandledError } from '@assessmentis/ontology'
import type { QuestionnaireItemLink } from '@assessmentis/clinical-domain/content-management'
import {
  Questionnaire,
  QuestionnaireId,
  QuestionnaireResponse,
  QuestionnaireResponseId,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/content-management'

import type { Route } from './+types/QuestionnaireResponse.$questionnaireResponseId'
import QuestionnaireForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import { updateEncounterRecordingsAndTranscripts } from '../modules/resources/Encounter/actions/updateEncounterRecordingsAndTranscripts'
import { getEncounterRecordings } from '../modules/resources/Encounter/actions/getEncounterRecordings'
import {
  EncounterId,
  EncounterRepository,
} from '@assessmentis/clinical-domain/administration'
import {
  Media,
  MediaRepository,
  Observation,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { Await, useNavigate } from 'react-router'
import { useState } from 'react'
import SplitPane from '../modules/common/components/SplitPane/SplitPane'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { useEffectTs } from '@assessmentis/react-util'

import { usePlatformContext } from '../layers/PlatformContext'
import { ErrorBoundary } from 'react-error-boundary'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'

const tryDecodeQuestionnaireResponseId = Schema.decodeOption(
  QuestionnaireResponseId
)

export const QuestionnaireResponseWithQuestionnaire = Schema.Struct({
  questionnaireResponse: QuestionnaireResponse.Schema,
  questionnaire: Questionnaire.Schema,
  recordings: Schema.Array(Media.Schema),
  observations: Schema.Array(Observation.Schema),
})

function questionnaireEffect(questionnaireResponseIdStr: string) {
  const questionnaireResponseIdMaybe = tryDecodeQuestionnaireResponseId(
    questionnaireResponseIdStr
  )

  const questionnaireResponseEffect = Effect.gen(function* () {
    const observationRepository = yield* ObservationRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const questionnaireRepository = yield* QuestionnaireRepository

    const questionnaireResponseId = yield* questionnaireResponseIdMaybe.pipe(
      Option.map((questionnaireResponseId) =>
        Effect.succeed(questionnaireResponseId)
      ),
      Option.getOrElse(() =>
        Effect.fail(
          new UnhandledError({ message: 'Questionnaire Response not found' })
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

    const observations = yield* observationRepository.getMany({
      encounter: `Encounter/${encounterId}`,
    })

    return {
      questionnaireResponse,
      questionnaire,
      recordings,
      observations,
    }
  })

  return questionnaireResponseEffect
}

export default function QuestionnaireResponseDetailsPage({
  params,
}: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const pageEffect = useMemo(() => {
    const { Media, Observation, Questionnaire, QuestionnaireResponse } =
      clinicalDataRepositoryService.effect
    return questionnaireEffect(params.questionnaireResponseId).pipe(
      Effect.provideServiceEffect(
        QuestionnaireResponseRepository,
        QuestionnaireResponse
      ),
      Effect.provideServiceEffect(QuestionnaireRepository, Questionnaire),
      Effect.provideServiceEffect(MediaRepository, Media),
      Effect.provideServiceEffect(ObservationRepository, Observation)
    )
  }, [clinicalDataRepositoryService, params.questionnaireResponseId])

  const dataPromise = useEffectTs(pageEffect)

  return (
    <Suspense fallback={<h1> Loading! </h1>}>
      <ErrorBoundary
        fallbackRender={({ error }) => <h1>Error: {String(error)}</h1>}
      >
        <Await resolve={dataPromise}>
          {(data) => <ResponsePage {...data} />}
        </Await>
      </ErrorBoundary>
    </Suspense>
  )
}

const ResponsePage = ({
  questionnaire,
  questionnaireResponse,
  recordings,
  observations,
}: typeof QuestionnaireResponseWithQuestionnaire.Type) => {
  const navigate = useNavigate()
  const { clinicalDataRepositoryService, VideoCallClientService } =
    usePlatformContext()

  const [highlightLinks, setHighlightLinks] = useState<
    Set<QuestionnaireItemLink>
  >(new Set())

  useBreadcrumbs([
    { label: 'Questionnaire Responses', href: '/QuestionnaireResponse' },
    { label: questionnaire.title || `Response ${questionnaireResponse.id}` },
  ])

  const repoEffect = useMemo(() => {
    return Effect.gen(function* () {
      const repoService = yield* ClinicalDataRepositoryService
      const repository = yield* repoService.effect.Media

      return repository
    }).pipe(
      Effect.provideService(
        ClinicalDataRepositoryService,
        clinicalDataRepositoryService
      )
    )
  }, [clinicalDataRepositoryService])

  const { collection, deleteItem: deleteMedia } = useClinicalDataCollection(
    repoEffect,
    recordings
  )

  const syncObservations = () => {
    console.log('Syncing observations...')

    let observations: Observation[] = []
    if (questionnaire.code?.[0].code == gad7.codings.questionnaire.code) {
      observations = gad7
        .extractObservationsFromGad7Response(questionnaireResponse)
        .map((obs) => ({
          ...obs,
          status: 'final',
        }))
    }
    console.log('Extracted observations:', observations)

    return Effect.runPromise(
      ObservationRepository.pipe(
        Effect.flatMap((o) => o.createMany(observations)),
        Effect.provideServiceEffect(
          ObservationRepository,
          clinicalDataRepositoryService.effect.Observation
        )
      )
    )
      .then((data) => {
        console.log('Synced observations:', data)
      })
      .catch((error) => {
        console.error('Failed to sync observations:', error)
      })
  }

  const syncVideo = (() => {
    const encounterIdStr =
      questionnaireResponse.encounter?.reference?.split('/')[1] ?? undefined
    if (!encounterIdStr) return undefined
    const encounterId = EncounterId.make(encounterIdStr)

    const updateEffect = updateEncounterRecordingsAndTranscripts(
      encounterId
    ).pipe(
      Effect.provideServiceEffect(
        MediaRepository,
        clinicalDataRepositoryService.effect.Media
      ),
      Effect.provideServiceEffect(
        VideoCallClient,
        VideoCallClientService.client
      ),
      Effect.provideServiceEffect(
        EncounterRepository,
        clinicalDataRepositoryService.effect.Encounter
      )
    )

    return () => Effect.runPromise(updateEffect).then(() => navigate(0))
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
            className="heading-4"
            style={{
              display: 'inline-flex',
              width: '100%',
              marginTop: 'var(--space-2)',
              marginBottom: 'var(--space-5)',
            }}
          >
            Recordings:
            <button
              className="element-button button-1"
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
          {collection.map(({ data }) => (
            <>
              <video
                style={{ width: '100%', aspectRatio: 'calc(16/9)' }}
                onTimeUpdate={(e) => {
                  if (data.createdDateTime) {
                    const videoTime = DateTime.add(data.createdDateTime, {
                      seconds: e.currentTarget.currentTime,
                    })
                    const nextAnswer =
                      QuestionnaireResponse.firstItemAnsweredAfter(
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

          <h3
            className="heading-4"
            style={{
              display: 'inline-flex',
              width: '100%',
              marginTop: 'var(--space-2)',
              marginBottom: 'var(--space-5)',
            }}
          >
            Observations:
            <button
              className="element-button button-1"
              style={{
                display: 'inline-block',
                marginTop: 'auto',
                marginBottom: 'auto',
                marginLeft: 'auto',
              }}
              onClick={syncObservations}
            >
              Refresh
            </button>
          </h3>
          <pre>{JSON.stringify(observations, null, 2)}</pre>
        </div>
      }
    />
  )
}
