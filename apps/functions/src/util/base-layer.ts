import { NodeSdk } from '@effect/opentelemetry'
import { FetchHttpClient } from '@effect/platform'
import { Layer, ManagedRuntime } from 'effect'
import { layerCurrentZoneLocal } from 'effect/DateTime'

import {
  FirebaseAdmin,
  FirebaseAdminDocumentStoreLayer,
} from '@assessmentis/firebase-server-infrastructure'
import type { AuthError } from '@assessmentis/ontology'
import type { CurrentUserId, DocumentStore } from '@assessmentis/platform-domain'

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

import { CurrentUserIdLayerLive } from '../layers/current-user-id-layer-live'
import { FunctionsContext } from '../tags/functions-context'

const NodeSdkLive = NodeSdk.layer(() => ({
  resource: { serviceName: 'assessmentis-functions' },
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({})),
}))

export const BaseLayer = Layer.mergeAll(
  layerCurrentZoneLocal,
  FetchHttpClient.layer,
  NodeSdkLive
).pipe(Layer.annotateSpans('NODE_ENV', process.env.NODE_ENV))

export const makeAuthedRequestRuntime = <C, E>(
  layer: Layer.Layer<C, E, CurrentUserId | FirebaseAdmin | FunctionsContext | DocumentStore>,
  context: typeof FunctionsContext.Service
): ManagedRuntime.ManagedRuntime<
  C | FunctionsContext | DocumentStore | FirebaseAdmin | CurrentUserId,
  E | AuthError
> =>
  ManagedRuntime.make(
    Layer.merge(BaseLayer, layer).pipe(
      Layer.provideMerge(FirebaseAdminDocumentStoreLayer),
      Layer.provideMerge(CurrentUserIdLayerLive),
      Layer.provideMerge(Layer.succeed(FunctionsContext, context)),
      Layer.provideMerge(FirebaseAdmin.Default)
    )
  )

export const makeRequestRuntime = <C, E>(
  layer: Layer.Layer<C, E, FirebaseAdmin | FunctionsContext | DocumentStore>,
  context: typeof FunctionsContext.Service
): ManagedRuntime.ManagedRuntime<C | FunctionsContext | DocumentStore | FirebaseAdmin, E> =>
  ManagedRuntime.make(
    Layer.merge(BaseLayer, layer).pipe(
      Layer.provideMerge(FirebaseAdminDocumentStoreLayer),
      Layer.provideMerge(
        Layer.mergeAll(Layer.succeed(FunctionsContext, context), FirebaseAdmin.Default)
      )
    )
  )

export const makeAdminRuntime = <C, E>(
  layer: Layer.Layer<C, E, FirebaseAdmin | DocumentStore>
): ManagedRuntime.ManagedRuntime<C | DocumentStore | FirebaseAdmin, E> =>
  ManagedRuntime.make(
    Layer.merge(BaseLayer, layer).pipe(
      Layer.provideMerge(FirebaseAdminDocumentStoreLayer),
      Layer.provideMerge(FirebaseAdmin.Default)
    )
  )
