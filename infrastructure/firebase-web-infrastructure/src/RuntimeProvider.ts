import * as GoogleFhir from '@assessmentis/google-fhir-infrastructure'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { QuestionnaireRepository } from '@assessmentis/clinical-domain/questionnaires'
import {
  EncounterRepository,
  ExternalVideoCallClient,
  ExternalVideoCallServiceError,
  QuestionnaireResponseRepository,
  UnhandledError,
} from '@assessmentis/clinical-domain'
import { WebSdk } from '@effect/opentelemetry'
import { FetchHttpClient } from '@effect/platform'
import { Effect, Layer, Match } from 'effect'
import { DailyCoExternalVideoCallClientLayer } from '@assessmentis/daily-co-infrastructure'
import { layerCurrentZoneLocal } from 'effect/DateTime'
import { FrontendConfig } from '@assessmentis/platform-domain'
import { getAuth } from 'firebase/auth'

const notImplemented = {
  Questionnaire: () =>
    Layer.succeed(QuestionnaireRepository, {
      createQuestionnaire: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      getQuestionnaire: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      getQuestionnaires: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      deleteQuestionnaire: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
    }),
  QuestionnaireResponse: () =>
    Layer.succeed(QuestionnaireResponseRepository, {
      createQuestionnaireResponses: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      getQuestionnaireResponse: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      getQuestionnaireResponses: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      deleteQuestionnaireResponse: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      updateQuestionnaireResponse: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
    }),
  Encounter: () =>
    Layer.succeed(EncounterRepository, {
      createEncounter: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      getEncounter: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      getEncounters: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      deleteEncounter: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
      updateEncounter: () =>
        Effect.fail(new UnhandledError({ cause: 'not implemented' })),
    }),

  ExternalVideoCallClient: () =>
    Layer.succeed(ExternalVideoCallClient, {
      createRoom: () =>
        Effect.fail(
          new ExternalVideoCallServiceError({
            message: 'not implemented',
            cause: null,
          })
        ),
      fetchRecordingsByRoomName: () =>
        Effect.fail(
          new ExternalVideoCallServiceError({
            message: 'not implemented',
            cause: null,
          })
        ),
      extractRoomNameFromUrl: () => undefined,
    }),
}

const WebSdkLive = WebSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-frontend' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

export const createRuntime = (frontendConfig: FrontendConfig) => {
  const questionnaireRepositoryLayer = Match.value(
    frontendConfig.questionnaireRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Questionnaire.Repository),
    Match.tag('not_implemented', notImplemented.Questionnaire),
    Match.exhaustive
  )

  const questionnaireResponseRepositoryLayer = Match.value(
    frontendConfig.questionnaireResponseRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.QuestionnaireResponse.Repository),
    Match.tag('not_implemented', notImplemented.QuestionnaireResponse),
    Match.exhaustive
  )
  const encounterRepositoryLayer = Match.value(
    frontendConfig.encounterRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Encounter.Repository),
    Match.tag('not_implemented', notImplemented.Encounter),
    Match.exhaustive
  )

  const externalVideoCallClientLayer = Match.value(
    frontendConfig.videoCallClient
  ).pipe(
    Match.tag('daily_co_proxy', (dailyCoConf) =>
      DailyCoExternalVideoCallClientLayer(
        async () => getAuth().currentUser?.getIdToken(),
        dailyCoConf
      )
    ),
    Match.tag('not_implemented', notImplemented.ExternalVideoCallClient),
    Match.exhaustive
  )

  return Layer.mergeAll(
    externalVideoCallClientLayer,
    questionnaireRepositoryLayer,
    questionnaireResponseRepositoryLayer,
    encounterRepositoryLayer,
    layerCurrentZoneLocal,
    FetchHttpClient.layer,
    WebSdkLive
  ).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV), Layer.orDie)
}
