import { Context, Schema } from 'effect'

/**
 * @deprecated use the config from the Google-Accounts project
 */
export const GoogleFhirConfig = Schema.TaggedStruct('google_fhir_store', {
  dataset: Schema.String,
  projectId: Schema.String,
  region: Schema.String,
  storeId: Schema.String,
})
export type GoogleFhirConfig = typeof GoogleFhirConfig.Type

export class LoadedGoogleFhirConfig extends Context.Tag('LoadedGoogleFhirConfig')<
  LoadedGoogleFhirConfig,
  GoogleFhirConfig
>() {}
