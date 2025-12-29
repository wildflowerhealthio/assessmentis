import * as GoogleFhir from '@assessmentis/google-fhir-infrastructure'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import {
  QuestionnaireRepository,
  QuestionnaireResponseRepository,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import {
  EncounterRepository,
  PatientRepository,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { MediaRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { ObservationRepository } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { WebSdk } from '@effect/opentelemetry'
import { FetchHttpClient } from '@effect/platform'
import { Effect, Layer, Match } from 'effect'
import { DailyCoExternalVideoCallClientLayer } from '@assessmentis/daily-co-infrastructure'
import { layerCurrentZoneLocal } from 'effect/DateTime'
import { FrontendConfig } from '@assessmentis/platform-domain'
import { getAuth } from 'firebase/auth'

const unimplementedClinicalDataRepository = {
  create: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
  createMany: () =>
    Effect.fail(new UnhandledError({ cause: 'not implemented' })),
  get: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
  getMany: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
  delete: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
  update: () => Effect.fail(new UnhandledError({ cause: 'not implemented' })),
}

const notImplemented = {
  Questionnaire: () =>
    Layer.succeed(QuestionnaireRepository, unimplementedClinicalDataRepository),
  QuestionnaireResponse: () =>
    Layer.succeed(
      QuestionnaireResponseRepository,
      unimplementedClinicalDataRepository
    ),
  Composition: () =>
    Layer.succeed(CompositionRepository, unimplementedClinicalDataRepository),
  Encounter: () =>
    Layer.succeed(EncounterRepository, unimplementedClinicalDataRepository),
  Media: () =>
    Layer.succeed(MediaRepository, unimplementedClinicalDataRepository),
  Observation: () =>
    Layer.succeed(ObservationRepository, unimplementedClinicalDataRepository),
  Patient: () =>
    Layer.succeed(PatientRepository, unimplementedClinicalDataRepository),
  Practitioner: () =>
    Layer.succeed(PractitionerRepository, unimplementedClinicalDataRepository),
  ExternalVideoCallClient: () =>
    Layer.succeed(ExternalVideoCallClient, {
      createRoom: () =>
        Effect.fail(
          new UnhandledError({
            cause: 'not implemented',
            message: 'createRoom not implemented',
          })
        ),
      getMediaRecordedInRoom: (_roomName) =>
        Effect.fail(
          new UnhandledError({
            cause: 'not implemented',
            message: 'getMediaRecordedInRoom not implemented',
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

  const compositionRepositoryLayer = Match.value(
    frontendConfig.compositionRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Composition.Repository),
    Match.tag('not_implemented', notImplemented.Composition),
    Match.exhaustive
  )

  const mediaRepositoryLayer = Match.value(frontendConfig.mediaRepository).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Media.Repository),
    Match.tag('not_implemented', notImplemented.Media),
    Match.exhaustive
  )

  const observationRepositoryLayer = Match.value(
    frontendConfig.observationRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Observation.Repository),
    Match.tag('not_implemented', notImplemented.Observation),
    Match.exhaustive
  )

  const patientRepositoryLayer = Match.value(
    frontendConfig.patientRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Patient.Repository),
    Match.tag('not_implemented', notImplemented.Patient),
    Match.exhaustive
  )

  const practitionerRepositoryLayer = Match.value(
    frontendConfig.practitionerRepository
  ).pipe(
    Match.tag('google_fhir_store', GoogleFhir.Practitioner.Repository),
    Match.tag('not_implemented', notImplemented.Practitioner),
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
    compositionRepositoryLayer,
    mediaRepositoryLayer,
    observationRepositoryLayer,
    patientRepositoryLayer,
    practitionerRepositoryLayer,
    layerCurrentZoneLocal,
    FetchHttpClient.layer,
    WebSdkLive
  ).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV), Layer.orDie)
}
