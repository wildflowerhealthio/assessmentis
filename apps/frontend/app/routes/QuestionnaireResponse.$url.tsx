import { DateTime, Effect, Option, Schema } from 'effect'
import { Suspense, useMemo, useState } from 'react'
import { Await, useNavigate } from 'react-router'

import {
  ClinicalDomainHub,
  Media,
  Observation,
  QuestionnaireResponse,
  type Questionnaire,
  type QuestionnaireItemLink,
} from '@assessmentis/clinical-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { useEffectTs } from '@assessmentis/react-util'

import { useBreadcrumbs } from 'app/modules/Breadcrumbs/useBreadcrumbs'
import QuestionnaireForm from 'app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm'
import { ErrorBoundary } from 'react-error-boundary'

import { useHub } from '../layers/useHub'
import { useResourceCollection } from '../layers/useResourceCollection'
import SplitPane from '../modules/common/components/SplitPane/SplitPane'
import type { Route } from './+types/QuestionnaireResponse.$url'

export default function QuestionnaireResponseDetailsPage({
  params,
}: Route.ComponentProps) {
  const hub = useHub()

  const pageEffect = useMemo(() => {
    const questionnaireResponseUrlMaybe = Schema.decodeOption(
      QuestionnaireResponse.UrlSchema
    )(params.url)

    return Effect.gen(function* () {
      const hub = yield* ClinicalDomainHub

      const questionnaireResponseUrl =
        yield* questionnaireResponseUrlMaybe.pipe(
          Option.map((url) => Effect.succeed(url)),
          Option.getOrElse(() =>
            Effect.fail(
              new UnhandledError({
                message: 'Questionnaire Response not found',
              })
            )
          )
        )

      const questionnaireResponse = yield* hub.getQuestionnaireResponse(
        questionnaireResponseUrl
      )

      const questionnaireUrl = questionnaireResponse.questionnaire
      const encounterUrl =
        questionnaireResponse.encounter?.reference ?? undefined

      const questionnaire = questionnaireUrl
        ? yield* hub.getQuestionnaire(questionnaireUrl)
        : undefined

      const observations = yield* hub.searchObservation({
        encounter: encounterUrl,
      })

      return {
        questionnaireResponse,
        questionnaire,
        encounterUrl,
        observations,
      }
    }).pipe(Effect.provideService(ClinicalDomainHub, hub))
  }, [hub, params.url])

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
                encounterUrl={data.encounterUrl}
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
  encounterUrl,
  observations,
}: {
  questionnaire: Questionnaire
  questionnaireResponse: QuestionnaireResponse
  encounterUrl: string | undefined
  observations: ReadonlyArray<Observation>
}) => {
  const navigate = useNavigate()
  const hub = useHub()

  const [highlightLinks, setHighlightLinks] = useState<
    Set<QuestionnaireItemLink>
  >(new Set())

  useBreadcrumbs(QuestionnaireResponse, {
    label:
      questionnaire.title ||
      `Response ${questionnaireResponse.url?.toString() ?? 'Unknown'}`,
  })

  const mediaFilters = useMemo(
    () => (encounterUrl ? { encounter: encounterUrl } : undefined),
    [encounterUrl]
  )
  const { collectionPromise: mediaPromise, deleteItem: deleteMedia } =
    useResourceCollection(Media, mediaFilters)

  const syncObservations = () => {
    console.log('Syncing observations...')

    let extractedObservations: Observation[] = []
    if (questionnaire.code?.[0].code == gad7.codings.questionnaire.code) {
      extractedObservations = gad7
        .extractObservationsFromGad7Response(questionnaireResponse)
        .map((obs) =>
          Observation.make({
            ...obs,
            status: 'final',
          })
        )
    }
    console.log('Extracted observations:', extractedObservations)

    return Effect.runPromise(hub.createManyObservation(extractedObservations))
      .then((data) => {
        console.log('Synced observations:', data)
      })
      .catch((error) => {
        console.error('Failed to sync observations:', error)
      })
  }

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
              onClick={() => navigate(0)}
            >
              Refresh
            </button>
          </h3>
          <Suspense fallback={<div>Loading recordings...</div>}>
            <Await resolve={mediaPromise}>
              {(mediaCollection) =>
                mediaCollection.map(({ data }) => (
                  <>
                    <video
                      style={{ width: '100%', aspectRatio: 'calc(16/9)' }}
                      onTimeUpdate={(e) => {
                        if (data.createdDateTime) {
                          const videoTime = DateTime.add(data.createdDateTime, {
                            seconds: e.currentTarget.currentTime,
                          })
                          const nextAnswer =
                            questionnaireResponse.firstItemAnsweredAfter(
                              videoTime
                            )

                          setHighlightLinks(
                            nextAnswer
                              ? new Set([nextAnswer.linkId])
                              : new Set()
                          )
                        }
                      }}
                      controls
                    >
                      <source
                        src={data.content.url?.toString()}
                        type="video/mp4"
                      />
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
                ))
              }
            </Await>
          </Suspense>

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
