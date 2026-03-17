import { BaseOriginUserConfig } from '@assessmentis/platform-domain'
import { Schema } from 'effect'

export const GoogleFhirOriginUserConfig = Schema.extend(
  BaseOriginUserConfig,
  Schema.Struct({
    _tag: Schema.Literal('google_fhir'),
    email: Schema.String,
  })
)

export type GoogleFhirOriginUserConfig = typeof GoogleFhirOriginUserConfig.Type
