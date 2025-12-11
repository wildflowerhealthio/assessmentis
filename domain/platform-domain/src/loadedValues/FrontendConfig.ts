import { Schema } from 'effect'
import {
  EncounterConfig,
  QuestionnaireConfig,
  QuestionnaireResponseConfig,
} from '@assessmentis/config-domain/googleFhir'
import { DailyCoProxyConfig } from '@assessmentis/config-domain/dailyCo'
import { OrgRoleError } from './OrgRole'

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
  videoCallClient: Schema.Union(
    Schema.TaggedStruct('daily_co_proxy', DailyCoProxyConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
})
export type FrontendConfig = typeof FrontendConfig.Type

export const FrontendConfigLoading = Schema.TaggedStruct(
  'FrontendConfigLoading',
  {}
)
export type FrontendConfigLoading = typeof FrontendConfigLoading.Type

export const FrontendConfigDataError = Schema.TaggedStruct(
  'FrontendConfigDataError',
  {
    cause: Schema.optional(Schema.Unknown),
  }
)
export type FrontendConfigDataError = typeof FrontendConfigDataError.Type

export const FrontendConfigError = Schema.Union(
  OrgRoleError,
  FrontendConfigLoading,
  FrontendConfigDataError
)
export type FrontendConfigError = typeof FrontendConfigError.Type
