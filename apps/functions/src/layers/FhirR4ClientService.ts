import type { FhirR4Client } from '@assessmentis/fhir-r4'
import { NodeGoogleHealthcareFhirR4ClientLayer } from '@assessmentis/google-fhir-node-infrastructure'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { Effect, Layer, Match } from 'effect'
import { LoadedOrg } from '@assessmentis/platform-domain'

/**
 * Backend service that resolves FhirR4Client based on org config.
 * Uses Node.js Google Healthcare API client for server-side operations.
 */
export const FhirR4ClientLayerLive: Layer.Layer<
  FhirR4Client,
  UnhandledError,
  LoadedOrg
> = Layer.unwrapEffect(
  Effect.gen(function* () {
    const org = yield* LoadedOrg
    const fhirServerConfig = org.frontendConfig.fhirServer

    return Match.value(fhirServerConfig).pipe(
      Match.tag('google_fhir_store', (googleConf) =>
        NodeGoogleHealthcareFhirR4ClientLayer.pipe(
          Layer.provide(Layer.succeed(LoadedGoogleFhirConfig, googleConf))
        )
      ),
      Match.tag('not_implemented', () =>
        Layer.fail(
          new UnhandledError({
            message: 'FHIR server type not yet implemented',
          })
        )
      ),
      Match.exhaustive
    )
  })
)
