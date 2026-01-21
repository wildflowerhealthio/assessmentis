import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeSdk } from '@effect/opentelemetry'
import { FetchHttpClient } from '@effect/platform'
import { Layer, ManagedRuntime } from 'effect'
import { layerCurrentZoneLocal } from 'effect/DateTime'
import { FunctionsContext } from '../tags/FunctionsContext'
import {
  FirebaseAdmin,
  FirebaseAdminDocumentStoreLayer,
} from '@assessmentis/firebase-server-infrastructure'
import { DocumentStore } from '@assessmentis/platform-domain'

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-functions' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

export const BaseLayer = Layer.mergeAll(
  layerCurrentZoneLocal,
  FetchHttpClient.layer,
  NodeSdkLive
).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV))

export const makeServerRuntime = <C, E>(
  layer: Layer.Layer<
    C,
    E,
    | Layer.Layer.Context<typeof BaseLayer>
    | FirebaseAdmin
    | FunctionsContext
    | DocumentStore
  >,
  context: typeof FunctionsContext.Service
): ManagedRuntime.ManagedRuntime<C, E> => {
  return ManagedRuntime.make(
    Layer.merge(BaseLayer, layer).pipe(
      Layer.provide(
        Layer.mergeAll(
          Layer.succeed(FunctionsContext, context),
          FirebaseAdminDocumentStoreLayer,
          FirebaseAdmin.Default
        )
      )
    )
  )
}
