import { Layer } from 'effect'

import { FirebaseAdminDocumentStoreLayer } from '@assessmentis/firebase-server-infrastructure'
import { LoadedUserLayer } from '@assessmentis/platform-domain'

export const LoadedUserLayerLive = LoadedUserLayer.pipe(
  Layer.provide(FirebaseAdminDocumentStoreLayer)
)
