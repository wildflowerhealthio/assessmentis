import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { WebSdk } from '@effect/opentelemetry'
import { FetchHttpClient } from '@effect/platform'
import { Layer } from 'effect'
import { layerCurrentZoneLocal } from 'effect/DateTime'

const WebSdkLive = WebSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-frontend' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

export const BaseLayer = Layer.mergeAll(
  layerCurrentZoneLocal,
  FetchHttpClient.layer,
  WebSdkLive
).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV))
