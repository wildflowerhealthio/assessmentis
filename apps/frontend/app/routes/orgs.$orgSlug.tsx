import { Effect, pipe } from 'effect'
import { Form } from 'react-router'

import {
  FirebaseWebDocumentStoreLayer,
  setDocument,
} from '@assessmentis/firebase-web-infrastructure'
import { DocumentStore } from '@assessmentis/platform-domain'

import { FirebaseWebLayer, auth, db } from '@/firebase-web-layer'

import type { Route } from './+types/orgs.$orgSlug'

const sandboxOrgData = (): Record<string, unknown> => ({
  emoji: '🧪',
  originServerConfigs: {},
  origins: {
    'https%3A%2F%2Fhealthcare.googleapis.com%2Fv1%2Fprojects%2Fassessment-is-sandbox%2Flocations%2Fnorthamerica-northeast2%2Fdatasets%2Fsandbox-dataset%2FfhirStores%2Fsandbox-store%2Ffhir':
      {
        _tag: 'google_fhir' as const,
        projectId: 'assessment-is-sandbox',
        region: 'northamerica-northeast2',
        dataset: 'sandbox-dataset',
        storeId: 'sandbox-store',
        activeResources: {
          Patient: true as const,
          Encounter: true as const,
          Observation: true as const,
        },
      },
  },
  slug: 'sandbox',
})

export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<{ data: Record<string, unknown> | null }> {
  console.log('Loading auth state')
  await auth.authStateReady()
  console.log('Loading org data for', params.orgSlug)
  const result = await Effect.runPromise(
    pipe(
      DocumentStore,
      Effect.flatMap((documentStore) => documentStore.get(['orgs', params.orgSlug])),
      Effect.catchTag('NotFoundError', () => Effect.succeed(null)),
      Effect.provide(FirebaseWebDocumentStoreLayer),
      Effect.provide(FirebaseWebLayer)
    )
  )
  console.log('loaded org data for', result)
  return { data: result }
}

export async function clientAction({ params }: Route.ClientActionArgs): Promise<void> {
  await Effect.runPromise(setDocument(db, 'orgs', params.orgSlug, sandboxOrgData()))
}

export default function OrgPage({
  params,
  loaderData: { data },
}: Route.ComponentProps): React.JSX.Element {
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
