import { db } from '../firebase'
import { DailyCoProxyConfig } from '@assessmentis/config-domain/dailyCo'
import {
  EncounterConfig,
  QuestionnaireConfig,
  QuestionnaireResponseConfig,
} from '@assessmentis/config-domain/googleFhir'
import { FrontendConfig } from '@assessmentis/platform-domain'
import { Route } from './+types/orgs.$orgSlug'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Form } from 'react-router'

const frontendConfig = (): FrontendConfig => {
  const fhirStore = {
    _tag: 'google_fhir_store' as const,
    dataset: 'Sandbox',
    projectId: 'assessment-is-sandbox',
    region: 'northamerica-northeast2',
    storeId: 'fhir-store',
  }

  return FrontendConfig.make({
    questionnaireRepository: QuestionnaireConfig.make({ ...fhirStore }),
    questionnaireResponseRepository: QuestionnaireResponseConfig.make({
      ...fhirStore,
    }),
    encounterRepository: EncounterConfig.make({ ...fhirStore }),
    videoCallClient: DailyCoProxyConfig.make({ dailyCoProxyUrl: '' }),
  } as const)
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const data = await getDoc(doc(db, 'orgs', params.orgSlug))
  return { data: data.exists() ? data.data() : null }
}
export async function clientAction({ params }: Route.ClientActionArgs) {
  await setDoc(doc(db, 'orgs', params.orgSlug), {
    slug: params.orgSlug,
    frontendConfig: frontendConfig(),
  })
}

export default function OrgPage({
  params,
  loaderData: { data },
}: Route.ComponentProps) {
  return (
    <div>
      <h1>Organization: {params.orgSlug}</h1>
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <>
          <p>This organization has been created in Firestore.</p>
          <Form method="post">
            <button type="submit">Create Org</button>
          </Form>
        </>
      )}
    </div>
  )
}
