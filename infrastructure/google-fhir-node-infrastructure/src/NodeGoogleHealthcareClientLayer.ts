import { Effect, Layer } from 'effect'
import google from '@googleapis/healthcare'

import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { UnhandledError } from '@assessmentis/ontology'
import { FirebaseAdmin } from '../../firebase-server-infrastructure/src/services'

export const NodeGoogleHealthcareFhirR4ClientLayer = Layer.effect(
  FhirR4Client,
  Effect.gen(function* () {
    const _ = yield* FirebaseAdmin
    const _healthcare = google.healthcare({
      version: 'v1',
      auth: new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      }),
    })

    const { projectId, dataset, region, storeId } =
      yield* LoadedGoogleFhirConfig
    const _parent = `projects/${projectId}/locations/${region}/datasets/${dataset}/fhirStores/${storeId}`

    return {
      read: () =>
        Effect.fail(new UnhandledError({ message: 'Not Implemented' })),
      search: () =>
        Effect.fail(new UnhandledError({ message: 'Not Implemented' })),
      create: () =>
        Effect.fail(new UnhandledError({ message: 'Not Implemented' })),
      update: () =>
        Effect.fail(new UnhandledError({ message: 'Not Implemented' })),
      delete: () =>
        Effect.fail(new UnhandledError({ message: 'Not Implemented' })),
    }
  })
)
