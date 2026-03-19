import { Effect, Schema, pipe } from 'effect'
import { Suspense, useMemo } from 'react'
import { Await, useAsyncError } from 'react-router'

import { ClinicalDomainHub, Encounter } from '@assessmentis/clinical-domain'
import { NotFoundError } from '@assessmentis/ontology'
import { useEffectTs } from '@assessmentis/react-util'

import '../traits/BreadcrumbLabel/implementations/encounter'
import '../traits/Link/implementations/encounter'

import { getFullEncounter } from '@/modules/interview-call/actions/get-full-encounter'
import InterviewCall from '@/modules/interview-call/features/InterviewCall/interview-call'

import { useHub } from '../layers/use-hub'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/resource-detail-page'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounter-display'
import { runEffectSync } from '../run-effect-sync'
import type { Route } from './+types/Encounter.$url._index'

const tryDecodeEncounterUrl = Schema.decode(Encounter.UrlSchema)

const EncounterError = (): React.JSX.Element => {
  const error = useAsyncError()
  if (error instanceof NotFoundError) {
    return <div>Encounter not found</div>
  }
  return <div>Error loading encounter: {String(error)}</div>
}

export default function EncounterPage({ params }: Route.ComponentProps): React.JSX.Element {
  const hub = useHub()

  const encounterEffect = useMemo(
    () =>
      pipe(
        params.url,
        tryDecodeEncounterUrl,
        Effect.catchAll((_parseErr) =>
          Effect.fail(
            new NotFoundError<'Encounter', { url: string | typeof Encounter.UrlSchema }>({
              resourceType: 'Encounter',
              params: { url: params.url },
            })
          )
        ),
        Effect.flatMap(getFullEncounter),
        Effect.provideService(ClinicalDomainHub, hub)
      ),
    [params.url, hub]
  )

  const encounterPromise = useEffectTs(encounterEffect)

  const justEncounterPromise = useMemo(
    () =>
      encounterPromise.then((enc) => ({
        label: runEffectSync(getEncounterDisplayName(enc.encounter)),
      })),
    [encounterPromise]
  )

  useBreadcrumbs(() => [Encounter, justEncounterPromise], [justEncounterPromise])

  return (
    <Suspense fallback={<div>Loading interview call...</div>}>
      <Await resolve={encounterPromise} errorElement={<EncounterError />}>
        {(encounterData) => (
          <ResourceDetailPage
            editTo={`${encounterData.encounter.Link}/edit`}
            title={runEffectSync(getEncounterDisplayName(encounterData.encounter))}
            sections={[
              {
                content: <InterviewCall encounter={encounterData} />,
                id: 'interview',
                title: undefined,
              },
            ]}
            debugData={encounterData}
          />
        )}
      </Await>
    </Suspense>
  )
}
