import { Effect, Schema } from 'effect'
import type { Scope } from 'effect'

import type { Composition } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { Origin, OriginDefinition, OriginFactory } from '@assessmentis/effectful-store'
import { buildFhirStoreParent, fhirProtocols, makeFhirR4ReadyOrigin } from '@assessmentis/fhir-r4'
import { GoogleFhirOriginDefinition } from '@assessmentis/google-account-infrastructure'
import type {
  GoogleFhirOriginUserConfig,
  GoogleUserCredentialIdentifier,
  GoogleUserOAuthToken,
} from '@assessmentis/google-account-infrastructure'
import { UnhandledError } from '@assessmentis/ontology'
import type { AuthError } from '@assessmentis/ontology'
import type { CredentialError, LiveCredential } from '@assessmentis/platform-domain'

import type {
  DiagnosticReport,
  Encounter,
  Location,
  Media,
  Observation,
  Patient,
  Practitioner,
  Questionnaire,
  QuestionnaireResponse,
} from '@assessmentis/clinical-domain'
import type { GapiClient } from '../services/loaded-gapi-client'
import type { GapiHealthcareClient } from '../services/loaded-gapi-healthcare-client'
import { makeGapiGoogleHealthcareClient } from './gapi-google-healthcare-client-layer'

const mapCredentialError = (error: CredentialError): AuthError | UnhandledError => {
  if (error._tag === 'AuthError') {
    return error
  }
  if (error._tag === 'UnhandledError') {
    return error
  }
  return new UnhandledError({ cause: error, message: String(error) })
}

export const buildGoogleFhirOriginUrl = (def: GoogleFhirOriginDefinition): ReadonlyUrl => {
  const parent = buildFhirStoreParent({
    dataset: def.dataset,
    projectId: def.projectId,
    region: def.region,
    storeId: def.storeId,
  })
  return ReadonlyUrl.make({
    host: 'healthcare.googleapis.com',
    pathname: `/v1/${parent}/fhir`,
    protocol: fhirProtocols.https,
  })
}

const decodeGoogleFhirDef = (def: unknown): GoogleFhirOriginDefinition =>
  Schema.decodeUnknownSync(GoogleFhirOriginDefinition)(def)

type SupportedClasses =
  | typeof Composition
  | typeof DiagnosticReport
  | typeof Encounter
  | typeof Location
  | typeof Media
  | typeof Observation
  | typeof Patient
  | typeof Practitioner
  | typeof Questionnaire
  | typeof QuestionnaireResponse

/**
 * Creates an {@link OriginType} for Google FHIR origins.
 *
 * Internalizes decoding, credential identifier derivation, "no credential"
 * degraded state, and GAPI client wiring. Credential resolution is injected
 * via the `getCredential` callback.
 */
export const makeGoogleFhirOriginType = (deps: {
  gapiClient: GapiClient
  healthcare: GapiHealthcareClient
  userId: string
  getCredential: (
    identifier: GoogleUserCredentialIdentifier
  ) => Effect.Effect<
    LiveCredential<'google_user_oauth_token', GoogleUserOAuthToken, unknown>,
    never,
    Scope.Scope
  >
}): OriginFactory<SupportedClasses, GoogleFhirOriginUserConfig> => ({
  make: <Keys extends SupportedClasses['DomainType']>(
    _originUrl: ReadonlyUrl,
    baseDef: OriginDefinition<Keys> & GoogleFhirOriginUserConfig
  ): Effect.Effect<
    Origin.AnyState<SupportedClasses & { DomainType: Keys }>,
    never,
    Scope.Scope
  > => {
    const def = decodeGoogleFhirDef(baseDef)

    const email = baseDef.email

    const identifier: GoogleUserCredentialIdentifier = {
      _tag: 'google_user_oauth_token',
      userId: deps.userId,
      email,
    }

    return deps.getCredential(identifier).pipe(
      Effect.map((credential) => {
        const getAccessToken = credential.get.pipe(
          Effect.map((t) => t.accessToken),
          Effect.mapError(mapCredentialError)
        )

        const config = {
          _tag: 'google_fhir_store' as const,
          projectId: def.projectId,
          region: def.region,
          dataset: def.dataset,
          storeId: def.storeId,
        }

        const client = makeGapiGoogleHealthcareClient({
          getAccessToken,
          gapiClient: deps.gapiClient,
          healthcare: deps.healthcare,
          config,
        })

        const originUrl = buildGoogleFhirOriginUrl(def)

        const readyOrigin = makeFhirR4ReadyOrigin({
          client,
          originUrl,
          provokeReauthenticate: () => Effect.void,
          provokeReauthorize: () => Effect.void,
        })

        return readyOrigin
      })
    )
  },
  tag: 'google_fhir',
})
