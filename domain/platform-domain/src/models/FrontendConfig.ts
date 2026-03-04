import { Schema } from 'effect'

import { DailyCoConfig, GoogleFhirConfig } from '@assessmentis/config-domain'

/**
 * The public parts of an org's configuration that are provided to clients.
 * Each member describes how ot configure each type of service the app uses.
 */
export const FrontendConfig = Schema.Struct({
  // Domain serves mapping to the resource that will fulfil them
  fhirServer: Schema.Union(
    Schema.TaggedStruct('google_fhir_store', GoogleFhirConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
  videoCallClient: Schema.Union(
    Schema.TaggedStruct('daily_co', DailyCoConfig.fields),
    Schema.TaggedStruct('not_implemented', {})
  ),
})
export type FrontendConfig = typeof FrontendConfig.Type
