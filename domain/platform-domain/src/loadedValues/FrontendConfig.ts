import { Schema } from 'effect'
import {
  EncounterConfig,
  MediaConfig,
  ObservationConfig,
  PatientConfig,
  PractitionerConfig,
  QuestionnaireConfig,
  QuestionnaireResponseConfig,
  CompositionConfig,
} from '@assessmentis/config-domain/googleFhir'
import { DailyCoProxyConfig } from '@assessmentis/config-domain/dailyCo'

/**
 * The public parts of an org's configuration that are provided to clients.
 * Each member describes how ot configure each type of service the app uses.
 */
export const FrontendConfig = Schema.Struct({
  // Domain serves mapping to the resource that will fulfil them
  questionnaireRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', QuestionnaireConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  questionnaireResponseRepository: Schema.Union(
    Schema.TaggedStruct(
      'google_fhir_store',
      QuestionnaireResponseConfig.fields
    ),
    Schema.TaggedStruct('not_implemented', {})
  ),
  encounterRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', EncounterConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  mediaRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', MediaConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  observationRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', ObservationConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  compositionRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', CompositionConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  patientRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', PatientConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  practitionerRepository: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', PractitionerConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  videoCallClient: Schema.Union(
    Schema.TaggedStruct('daily_co_proxy', DailyCoProxyConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
})
export type FrontendConfig = typeof FrontendConfig.Type
