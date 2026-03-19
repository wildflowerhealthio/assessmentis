import { Effect, Layer, Schema } from 'effect'

import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import type { FhirR4Client } from '@assessmentis/fhir-r4'
import { GoogleFhirOriginDefinition } from '@assessmentis/google-account-infrastructure'
import { NodeGoogleHealthcareFhirR4ClientLayer } from '@assessmentis/google-fhir-node-infrastructure'
import { UnhandledError } from '@assessmentis/ontology'
import { LoadedOrg } from '@assessmentis/platform-domain'

const decodeGoogleFhirOrigin = Schema.decodeUnknownOption(GoogleFhirOriginDefinition)

const findGoogleFhirOrigin = (
  origins: Readonly<Record<string, unknown>>
): typeof GoogleFhirOriginDefinition.Type | undefined => {
  for (const def of Object.values(origins)) {
    const decoded = decodeGoogleFhirOrigin(def)
    if (decoded._tag === 'Some') {
      return decoded.value
    }
  }
  return undefined
}

/**
 * Backend service that resolves FhirR4Client based on org config.
 * Uses Node.js Google Healthcare API client for server-side operations.
 */
export const FhirR4ClientLayerLive: Layer.Layer<FhirR4Client, UnhandledError, LoadedOrg> =
  Layer.unwrapEffect(
    Effect.gen(function* FhirR4ClientLayerLive() {
      const org = yield* LoadedOrg
      const googleFhirDef = findGoogleFhirOrigin(org.origins)

      if (googleFhirDef) {
        return NodeGoogleHealthcareFhirR4ClientLayer.pipe(
          Layer.provide(
            Layer.succeed(LoadedGoogleFhirConfig, {
              _tag: 'google_fhir_store',
              dataset: googleFhirDef.dataset,
              projectId: googleFhirDef.projectId,
              region: googleFhirDef.region,
              storeId: googleFhirDef.storeId,
            })
          )
        )
      }

      return Layer.fail(
        new UnhandledError({
          message: 'No Google FHIR origin configured for this org',
        })
      )
    })
  )
