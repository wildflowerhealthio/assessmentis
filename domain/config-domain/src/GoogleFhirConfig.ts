import { Context, Schema } from 'effect'

export const GoogleFhirConfig = Schema.TaggedStruct('google_fhir_store', {
  apiKey: Schema.NullOr(Schema.String),
  projectId: Schema.String,
  region: Schema.String,
  dataset: Schema.String,
  storeId: Schema.String,
})
export type GoogleFhirConfig = typeof GoogleFhirConfig.Type

export class LoadedGoogleFhirConfig extends Context.Tag(
  'LoadedGoogleFhirConfig'
)<LoadedGoogleFhirConfig, GoogleFhirConfig>() {}
