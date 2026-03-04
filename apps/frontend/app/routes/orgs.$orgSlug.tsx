import { Effect, pipe } from 'effect'
import { Form } from 'react-router'

import { DailyCoConfig } from '@assessmentis/config-domain'
import {
  FirebaseWebDocumentStoreLayer,
  setDocument,
} from '@assessmentis/firebase-web-infrastructure'
import { DocumentStore, FrontendConfig } from '@assessmentis/platform-domain'

import { auth, db, FirebaseWebLayer } from 'app/FirebaseWebLayer'

import type { Route } from './+types/orgs.$orgSlug'

const frontendConfig = (): FrontendConfig => {
  const fhirStore: FrontendConfig['fhirServer'] = {
    _tag: 'google_fhir_store' as const,
    apiKey: null,
    dataset: 'sandbox-dataset',
    projectId: 'assessment-is-sandbox',
    region: 'northamerica-northeast2',
    storeId: 'sandbox-store',
  }

  return FrontendConfig.make({
    fhirServer: fhirStore,
    videoCallClient: DailyCoConfig.make({ dailyCoProxyUrl: '' }),
  } as const)
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  console.log('Loading auth state')
  await auth.authStateReady()
  console.log('Loading org data for', params.orgSlug)
  const result = await Effect.runPromise(
    pipe(
      DocumentStore,
      Effect.flatMap((documentStore) =>
        documentStore.get('orgs', params.orgSlug)
      ),
      Effect.catchTag('NotFoundError', () => Effect.succeed(null)),
      Effect.provide(FirebaseWebDocumentStoreLayer),
      Effect.provide(FirebaseWebLayer)
    )
  )
  console.log('loaded org data for', result)
  return { data: result }
}

export async function clientAction({ params }: Route.ClientActionArgs) {
  await Effect.runPromise(
    setDocument(db, 'orgs', params.orgSlug, {
      slug: params.orgSlug,
      frontendConfig: frontendConfig(),
    })
  )
}

export default function OrgPage({
  params,
  loaderData: { data },
}: Route.ComponentProps) {
  return (
    <div>
      <h1>Organization: {params.orgSlug}</h1>
      {data ? (
        <>
          (<pre>{JSON.stringify(data, null, 2)}</pre>)
          <Form method="post">
            <button type="submit">Update Org</button>
          </Form>
        </>
      ) : (
        <>
          <p>This organization has not been created in Firestore.</p>
          <Form method="post">
            <button type="submit">Create Org</button>
          </Form>
        </>
      )}
    </div>
  )
}
