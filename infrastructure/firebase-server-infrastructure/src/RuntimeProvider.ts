import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeSdk } from '@effect/opentelemetry'
import { FetchHttpClient } from '@effect/platform'
import { Layer } from 'effect'
import { layerCurrentZoneLocal } from 'effect/DateTime'
import {
  FrontendConfig,
  ServerRuntimeContext,
} from '@assessmentis/platform-domain'
import {
  createRepositoryLayers,
  createVideoCallClientLayer,
} from '@assessmentis/firebase-web-infrastructure'

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-functions' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

/**
 * Create server-side runtime layer
 * Uses NodeSdk for telemetry and custom auth token provider
 *
 * @param frontendConfig - The org's frontend configuration
 * @param getAuthToken - Function to retrieve auth token for video call client
 * @returns Effect Layer with all server runtime dependencies
 */
export const createServerRuntime = (
  frontendConfig: FrontendConfig,
  getAuthToken: () => Promise<string | undefined>
): Layer.Layer<ServerRuntimeContext, never> => {
  const repos = createRepositoryLayers(frontendConfig)
  const videoClient = createVideoCallClientLayer(frontendConfig, getAuthToken)

  return Layer.mergeAll(
    videoClient,
    repos.questionnaireRepositoryLayer,
    repos.questionnaireResponseRepositoryLayer,
    repos.encounterRepositoryLayer,
    repos.compositionRepositoryLayer,
    repos.mediaRepositoryLayer,
    repos.observationRepositoryLayer,
    repos.patientRepositoryLayer,
    repos.practitionerRepositoryLayer,
    layerCurrentZoneLocal,
    FetchHttpClient.layer,
    NodeSdkLive
  ).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV), Layer.orDie)
}
