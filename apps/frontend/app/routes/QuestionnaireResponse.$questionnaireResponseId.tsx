import { DateTime, Effect, Option, Schema } from 'effect'
import { Suspense, useMemo, useState } from 'react'
import { Await, useNavigate } from 'react-router'

import {
  Media,
  Observation,
  Questionnaire,
  QuestionnaireResponse,
  type QuestionnaireItemLink,
} from '@assessmentis/clinical-domain'
import {
  MediaRepository,
  ObservationRepository,
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/repositories'
import { UnhandledError } from '@assessmentis/ontology'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { useEffectTs } from '@assessmentis/react-util'

import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import QuestionnaireForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import { ErrorBoundary } from 'react-error-boundary'

import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'
import SplitPane from '../modules/common/components/SplitPane/SplitPane'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'
import { getEncounterRecordings } from '../modules/resources/Encounter/actions/getEncounterRecordings'
import type { Route } from './+types/QuestionnaireResponse.$questionnaireResponseId'

export const QuestionnaireResponseWithQuestionnaire = Schema.Struct({
  questionnaireResponse: QuestionnaireResponse,
  questionnaire: Questionnaire,
  recordings: Schema.Array(Media),
  observations: Schema.Array(Observation),
})

function questionnaireEffect(questionnaireResponseIdStr: string) {
  const questionnaireResponseUrlMaybe = Schema.decodeOption(
    QuestionnaireResponse.UrlSchema
  )(questionnaireResponseIdStr)

  const questionnaireResponseEffect = Effect.gen(function* () {
    const observationRepository = yield* ObservationRepository
    const questionnaireResponseRepository =
      yield* QuestionnaireResponseRepository
    const questionnaireRepository = yield* QuestionnaireRepository

    const questionnaireResponseUrl = yield* questionnaireResponseUrlMaybe.pipe(
      Option.map((questionnaireResponseUrl) =>
        Effect.succeed(questionnaireResponseUrl)
      ),
      Option.getOrElse(() =>
        Effect.fail(
          new UnhandledError({ message: 'Questionnaire Response not found' })
        )
      )
    )
    const questionnaireResponse = yield* questionnaireResponseRepository.get(
      questionnaireResponseUrl
    )

    const questionnaireUrl = questionnaireResponse.questionnaire
    const encounterId =
      questionnaireResponse.encounter?.reference?.split('/')[1] ?? undefined

    const recordings = encounterId
      ? yield* getEncounterRecordings(encounterId)
      : []

    const questionnaire = questionnaireUrl
      ? yield* questionnaireRepository.get(questionnaireUrl)
      : undefined

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
          {(data) =>
            data.questionnaire ? (
              <ResponsePage
                questionnaire={data.questionnaire}
                questionnaireResponse={data.questionnaireResponse}
                recordings={data.recordings}
                observations={data.observations}
              />
            ) : (
              <h2>No Questionnaire?</h2>
            )
          }
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
  const { clinicalDataRepositoryService } = usePlatformContext()

  const [highlightLinks, setHighlightLinks] = useState<
    Set<QuestionnaireItemLink>
  >(new Set())

  useBreadcrumbs([
    { label: 'Questionnaire Responses', href: '/QuestionnaireResponse' },
    {
      label:
        questionnaire.title ||
        `Response ${questionnaireResponse.url?.toString() ?? 'Unknown'}`,
    },
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
        .map((obs) =>
          Observation.make({
            ...obs,
            status: 'final',
          })
        )
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
    // TODO: Replace with hub based approach
    return () => navigate(0)
    /*
    const encounterReference = questionnaireResponse.encounter?.reference
    const encounterUrl = encounterReference
      ? Schema.decodeOption(Encounter.UrlSchema)(encounterReference)
      : Option.none()
    if (Option.isNone(encounterUrl)) return undefined

    const updateEffect = updateEncounterRecordingsAndTranscripts(
      encounterUrl.value
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
    */
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
                      questionnaireResponse.firstItemAnsweredAfter(videoTime)

                    setHighlightLinks(
                      nextAnswer ? new Set([nextAnswer.linkId]) : new Set()
                    )
                  }
                }}
                controls
              >
                <source src={data.content.url?.toString()} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <button
                className="element-button button-1 filled accent-red"
                style={{
                  marginTop: 'var(--space-1)',
                  marginBottom: 'var(--space-5)',
                  width: '100%',
                }}
                onClick={() => deleteMedia(data.url?.toString())}
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
