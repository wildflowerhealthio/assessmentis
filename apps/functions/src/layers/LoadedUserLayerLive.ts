import { LoadedUserLayer } from '@assessmentis/platform-domain'
import { Layer } from 'effect'
import { FirebaseAdminDocumentStoreLayer } from '@assessmentis/firebase-server-infrastructure'

export const LoadedUserLayerLive = LoadedUserLayer.pipe(
  Layer.provide(FirebaseAdminDocumentStoreLayer)
)
