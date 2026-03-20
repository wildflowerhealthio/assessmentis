import { DateTime, Effect, Option, Schema } from 'effect'
import { Fragment, Suspense, useMemo, useState } from 'react'
import { Await, useNavigate } from 'react-router'

import {
  ClinicalDomainHub,
  Media,
  Observation,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type { QuestionnaireItemLink } from '@assessmentis/clinical-domain'
import { Search } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'
import { gad7 } from '@assessmentis/questionnaire-entities'
import { useEffectTs } from '@assessmentis/react-util'

import '../traits/BreadcrumbLabel/implementations/questionnaire-response'
import '../traits/Link/implementations/questionnaire-response'

import { ErrorBoundary } from 'react-error-boundary'
import { useBreadcrumbs } from '@/modules/Breadcrumbs/use-breadcrumbs'
import QuestionnaireForm from '@/modules/resources/Questionnaire/features/QuestionnaireForm/questionnaire-form'

import { useHub } from '../layers/use-hub'
import { useResourceCollection } from '../layers/use-resource-collection'
import SplitPane from '../modules/common/components/SplitPane/split-pane'
import type { Route } from './+types/QuestionnaireResponse.$url'

export default function QuestionnaireResponseDetailsPage({
  params,
}: Route.ComponentProps): React.JSX.Element {
  const hub = useHub()

  const pageEffect = useMemo(() => {
    const questionnaireResponseUrlMaybe = Schema.decodeOption(QuestionnaireResponse.UrlSchema)(
      params.url
    )

    return Effect.gen(function* () {
      const clinicalHub = yield* ClinicalDomainHub

      const questionnaireResponseUrl = yield* questionnaireResponseUrlMaybe.pipe(
        Option.map((url) => Effect.succeed(url)),
        Option.getOrElse(() =>
          Effect.fail(
            new UnhandledError({
              message: 'Questionnaire Response not found',
            })
          )
        )
      )

      const questionnaireResponse = yield* clinicalHub.get(
        QuestionnaireResponse,
        questionnaireResponseUrl
      )

      const questionnaireUrl = questionnaireResponse.questionnaire
      const encounterUrl = questionnaireResponse.encounter?.reference ?? undefined

      const questionnaire = questionnaireUrl
        ? yield* clinicalHub.get(Questionnaire, questionnaireUrl)
        : undefined

      const observations = encounterUrl
        ? yield* clinicalHub.search(Observation, {
            encounter: Search.Condition.Exactly(encounterUrl),
          })
        : []

      return {
        encounterUrl,
        observations,
        questionnaire,
        questionnaireResponse,
      }
    }).pipe(Effect.provideService(ClinicalDomainHub, hub))
  }, [hub, params.url])

  const dataPromise = useEffectTs(pageEffect)

  return (
    <Suspense fallback={<h1> Loading! </h1>}>
      <ErrorBoundary fallbackRender={({ error }) => <h1>Error: {String(error)}</h1>}>
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
  observations: readonly Observation[]
}): React.JSX.Element => {
  const navigate = useNavigate()
  const hub = useHub()

  const [highlightLinks, setHighlightLinks] = useState<Set<QuestionnaireItemLink>>(new Set())

  useBreadcrumbs(
    () => [
      QuestionnaireResponse,
      questionnaire.title ?? `Response ${questionnaireResponse.url?.toString() ?? 'Unknown'}`,
    ],
    [questionnaire.title, questionnaireResponse.url]
  )

  const mediaFilters = useMemo(
    () => (encounterUrl ? { encounter: Search.Condition.Exactly(encounterUrl) } : undefined),
    [encounterUrl]
  )
  const { collectionPromise: mediaPromise, deleteItem: deleteMedia } = useResourceCollection(
    Media,
    mediaFilters
  )

  const syncObservations = (): Promise<readonly Observation[]> => {
    let extractedObservations: Observation[] = []
    if (questionnaire.code?.[0].code === gad7.codings.questionnaire.code) {
      extractedObservations = gad7
        .extractObservationsFromGad7Response(questionnaireResponse)
        .map((obs) =>
          Observation.make({
            ...obs,
            status: 'final',
          })
        )
    }

    return Effect.runPromise(hub.createMany(Observation, extractedObservations))
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
              marginBottom: 'var(--space-5)',
              marginTop: 'var(--space-2)',
              width: '100%',
            }}
          >
            Recordings:
            <button
              type="button"
              className="element-button button-1"
              style={{
                display: 'inline-block',
                marginBottom: 'auto',
                marginLeft: 'auto',
                marginTop: 'auto',
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
                  <Fragment key={data.url?.toString()}>
                    <video
                      style={{ aspectRatio: 'calc(16/9)', width: '100%' }}
                      onTimeUpdate={(e) => {
                        if (data.createdDateTime) {
                          const videoTime = DateTime.add(data.createdDateTime, {
                            seconds: e.currentTarget.currentTime,
                          })
                          const nextAnswer = questionnaireResponse.firstItemAnsweredAfter(videoTime)

                          setHighlightLinks(nextAnswer ? new Set([nextAnswer.linkId]) : new Set())
                        }
                      }}
                      controls
                    >
                      <source src={data.content.url?.toString()} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <button
                      type="button"
                      className="element-button button-1 filled accent-red"
                      style={{
                        marginBottom: 'var(--space-5)',
                        marginTop: 'var(--space-1)',
                        width: '100%',
                      }}
                      onClick={() => deleteMedia(data.url?.toString())}
                    >
                      Delete
                    </button>
                  </Fragment>
                ))
              }
            </Await>
          </Suspense>

          <h3
            className="heading-4"
            style={{
              display: 'inline-flex',
              marginBottom: 'var(--space-5)',
              marginTop: 'var(--space-2)',
              width: '100%',
            }}
          >
            Observations:
            <button
              type="button"
              className="element-button button-1"
              style={{
                display: 'inline-block',
                marginBottom: 'auto',
                marginLeft: 'auto',
                marginTop: 'auto',
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
