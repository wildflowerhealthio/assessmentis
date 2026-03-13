import { Effect, Schema, type Scope } from 'effect'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import {
  ReadonlyUrl,
  type Origin,
  type OriginConfig,
  type OriginFactory,
} from '@assessmentis/effectful-store'
import {
  buildFhirStoreParent,
  fhirProtocols,
  makeFhirR4ReadyOrigin,
} from '@assessmentis/fhir-r4'
import {
  GoogleFhirOriginDefinition,
  type GoogleUserCredentialIdentifier,
  type GoogleUserOAuthToken,
} from '@assessmentis/google-account-infrastructure'
import { UnhandledError, type AuthError } from '@assessmentis/ontology'
import type {
  CredentialError,
  LiveCredential,
} from '@assessmentis/platform-domain'

import type { GapiClient } from '../services/LoadedGapiClient'
import type { GapiHealthcareClient } from '../services/LoadedGapiHealthcareClient'
import { makeGapiGoogleHealthcareClient } from './GapiGoogleHealthcareClientLayer'

const mapCredentialError = (
  error: CredentialError
): AuthError | UnhandledError => {
  if (error._tag === 'AuthError') return error
  if (error._tag === 'UnhandledError') return error
  return new UnhandledError({ message: String(error), cause: error })
}

export const buildGoogleFhirOriginUrl = (
  def: GoogleFhirOriginDefinition
): ReadonlyUrl => {
  const parent = buildFhirStoreParent({
    projectId: def.projectId,
    region: def.region,
    dataset: def.dataset,
    storeId: def.storeId,
  })
  return ReadonlyUrl.make({
    protocol: fhirProtocols.https,
    host: 'healthcare.googleapis.com',
    pathname: `/v1/${parent}/fhir`,
  })
}

const decodeGoogleFhirDef = (def: unknown) =>
  Schema.decodeUnknownSync(GoogleFhirOriginDefinition)(def)

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
}): OriginFactory<ResourceDataTypes> => ({
  tag: 'google_fhir',
  make: (
    originUrl: ReadonlyUrl,
    baseDef: OriginConfig,
    originConfig: Record<string, unknown> | undefined
  ) => {
    const def = decodeGoogleFhirDef(baseDef)

    if (!originConfig) {
      return Effect.succeed({
        originUrl: buildGoogleFhirOriginUrl(def),
        supportedResources: def.activeResources,
        resolver: undefined,
        errorStatus: new UnhandledError({
          message: 'No credential configured for Google FHIR origin',
        }),
        provokeReauthenticate: () => Effect.void,
        provokeReauthorize: () => Effect.void,
      } satisfies Origin.Errored<ResourceDataTypes, never>)
    }

    const identifier: GoogleUserCredentialIdentifier = {
      _tag: 'google_user_oauth_token',
      userId: deps.userId,
      email: String(originConfig['email']),
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

        return { ...readyOrigin, activeResources: def.activeResources }
      })
    )
  },
})
