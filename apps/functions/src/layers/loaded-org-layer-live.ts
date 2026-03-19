import { Layer } from 'effect'

import { FirebaseAdminDocumentStoreLayer } from '@assessmentis/firebase-server-infrastructure'
import { LoadedOrgLayer } from '@assessmentis/platform-domain'

export const LoadedOrgLayerLive = LoadedOrgLayer.pipe(
  Layer.provide(FirebaseAdminDocumentStoreLayer)
)
