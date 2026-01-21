import { Effect, Schema } from 'effect'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import { getFullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import InterviewCall from 'app/modules/interview-call/features/InterviewCall/InterviewCall'
import type { Route } from './+types/_resource.Encounter.$encounterId._index'
import { runEffectSync } from '../runEffectSync'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import { Suspense, useMemo } from 'react'
import { NotFoundError } from '@assessmentis/ontology'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { useEffectTs } from '@assessmentis/react-util'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await, useAsyncError } from 'react-router'

const tryDecodeEncounterId = Schema.decodeOption(EncounterId)

const EncounterError = () => {
  const error = useAsyncError()
  if (error instanceof NotFoundError) {
    return <div>Encounter not found</div>
  }
  return <div>Error loading encounter: {String(error)}</div>
}

export default function EncounterPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const encounterEffect = useMemo(() => {
    const encounterIdStr = params.encounterId
    const encounterIdMaybe = tryDecodeEncounterId(encounterIdStr)
    return getFullEncounter(encounterIdMaybe).pipe(
      Effect.provideService(
        ClinicalDataRepositoryService,
        clinicalDataRepositoryService
      )
    )
  }, [params.encounterId, clinicalDataRepositoryService])

  const encounterPromise = useEffectTs(encounterEffect)

  const breadcrumbs = useMemo(() => {
    return [
      { label: 'Encounters', href: '/Encounter' },
      encounterPromise.then((enc) => ({
        label: runEffectSync(getEncounterDisplayName(enc)),
      })),
    ]
  }, [encounterPromise])

  useBreadcrumbs(breadcrumbs)

  return (
    <Suspense fallback={<div>Loading interview call...</div>}>
      <Await resolve={encounterPromise} errorElement={<EncounterError />}>
        {(encounterData) => (
          <ResourceDetailPage
            editTo={`/Encounter/${encounterData.id}/edit`}
            title={runEffectSync(getEncounterDisplayName(encounterData))}
            subtitle={`Encounter ID: ${encounterData.id}`}
            sections={[
              {
                id: 'interview',
                title: 'Interview Call',
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
