import { Schema } from 'effect'

export const BaseConfig = Schema.TaggedStruct('google_fhir_store', {
  projectId: Schema.String,
  region: Schema.String,
  dataset: Schema.String,
  storeId: Schema.String,
})
export type BaseConfig = typeof BaseConfig.Type

export const EncounterConfig = BaseConfig
export type EncounterConfig = typeof EncounterConfig.Type

export const QuestionnaireConfig = BaseConfig
export type QuestionnaireConfig = typeof QuestionnaireConfig.Type

export const QuestionnaireResponseConfig = BaseConfig
export type QuestionnaireResponseConfig =
  typeof QuestionnaireResponseConfig.Type

export const MediaConfig = BaseConfig
export type MediaConfig = typeof MediaConfig.Type
