import { BaseOriginUserConfig } from '@assessmentis/platform-domain'
import { Schema } from 'effect'

/**
 * Per-user configuration for a Google FHIR origin, carrying the authenticated
 * user's email.
 *
 * @remarks
 * Extends {@link BaseOriginUserConfig} with `_tag: 'google_fhir'` and an
 * `email` field identifying the Google account.
 */
export const GoogleFhirOriginUserConfig = Schema.extend(
  BaseOriginUserConfig,
  Schema.Struct({
    _tag: Schema.Literal('google_fhir'),
    email: Schema.String,
  })
)

export type GoogleFhirOriginUserConfig = typeof GoogleFhirOriginUserConfig.Type
