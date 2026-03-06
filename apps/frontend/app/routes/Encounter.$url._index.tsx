import { Effect, pipe, Schema } from 'effect'
import { Suspense, useMemo } from 'react'
import { Await, useAsyncError } from 'react-router'

import { ClinicalDomainHub, Encounter } from '@assessmentis/clinical-domain'
import { NotFoundError } from '@assessmentis/ontology'
import { useEffectTs } from '@assessmentis/react-util'

import 'app/traits/Link/implementations/Encounter'

import { getFullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import InterviewCall from 'app/modules/interview-call/features/InterviewCall/InterviewCall'

import { useHub } from '../layers/useHub'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import { runEffectSync } from '../runEffectSync'
import type { Route } from './+types/Encounter.$url._index'

const tryDecodeEncounterUrl = Schema.decode(Encounter.UrlSchema)

const EncounterError = () => {
  const error = useAsyncError()
  if (error instanceof NotFoundError) {
    return <div>Encounter not found</div>
  }
  return <div>Error loading encounter: {String(error)}</div>
}

export default function EncounterPage({ params }: Route.ComponentProps) {
  const hub = useHub()

  const encounterEffect = useMemo(() => {
    return pipe(
      params.url,
      tryDecodeEncounterUrl,
      Effect.catchAll((_paresErr) =>
        Effect.fail(
          new NotFoundError<
            'Encounter',
            { url: string | typeof Encounter.UrlSchema }
          >({
            resourceType: 'Encounter',
            params: { url: params.url },
          })
        )
      ),
      Effect.flatMap(getFullEncounter),
      Effect.provideService(ClinicalDomainHub, hub)
    )
  }, [params.url, hub])

  const encounterPromise = useEffectTs(encounterEffect)

  const justEncounterPromise = useMemo(() => {
    return encounterPromise.then((enc) => ({
      label: runEffectSync(getEncounterDisplayName(enc.encounter)),
    }))
  }, [encounterPromise])

  useBreadcrumbs(Encounter, justEncounterPromise)

  return (
    <Suspense fallback={<div>Loading interview call...</div>}>
      <Await resolve={encounterPromise} errorElement={<EncounterError />}>
        {(encounterData) => (
          <ResourceDetailPage
            editTo={`${encounterData.encounter.Link}/edit`}
            title={runEffectSync(
              getEncounterDisplayName(encounterData.encounter)
            )}
            sections={[
              {
                id: 'interview',
                title: undefined,
                content: <InterviewCall encounter={encounterData} />,
              },
            ]}
            debugData={encounterData}
          />
        )}
      </Await>
    </Suspense>
  )
}
