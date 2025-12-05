import { NodeSdk } from '@effect/opentelemetry'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Layer, Logger, ManagedRuntime } from 'effect'

// Set up tracing with the OpenTelemetry SDK
const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-next-cloud-function' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

export const serverAppLayer = Layer.mergeAll(NodeSdkLive, Logger.pretty).pipe(
  Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV),
  Layer.orDie
)

export const serverRuntime = () => ManagedRuntime.make(serverAppLayer)

export type ServerRuntime = typeof serverRuntime
