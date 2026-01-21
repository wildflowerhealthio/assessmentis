import { FirebaseAdminDocumentStoreLayer } from '@assessmentis/firebase-server-infrastructure'
import { LoadedOrgLayer } from '@assessmentis/platform-domain'
import { Layer } from 'effect'

export const LoadedOrgLayerLive = LoadedOrgLayer.pipe(
  Layer.provide(FirebaseAdminDocumentStoreLayer)
)
