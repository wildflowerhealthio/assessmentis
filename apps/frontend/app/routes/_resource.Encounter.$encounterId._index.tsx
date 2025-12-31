import { Schema } from 'effect'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import { getFullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import InterviewCall from 'app/modules/interview-call/features/InterviewCall/InterviewCall'
import type { Route } from './+types/_resource.Encounter.$encounterId._index'
import { runEffectSync, useResourceRunEffect } from '../clientRuntime'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import { useMemo } from 'react'
import { NotFoundError } from '@assessmentis/ontology'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

const tryDecodeEncounterId = Schema.decodeOption(EncounterId)

export default function EncounterPage({ params }: Route.ComponentProps) {
  const encounterLoader = useResourceRunEffect(
    useMemo(() => {
      const encounterIdStr = params.encounterId
      const encounterIdMaybe = tryDecodeEncounterId(encounterIdStr)
      return getFullEncounter(encounterIdMaybe)
    }, [params.encounterId])
  )

  useBreadcrumbs(
    encounterLoader._tag === 'loaded'
      ? [
          { label: 'Encounters', href: '/Encounter' },
          {
            label: runEffectSync(
              getEncounterDisplayName(encounterLoader.value)
            ),
          },
        ]
      : [{ label: 'Encounters', href: '/Encounter' }, { loading: true }]
  )

  if (encounterLoader._tag === 'loading') {
    return <div>Loading encounter...</div>
  }

  if (encounterLoader._tag === 'error') {
    if (encounterLoader.error instanceof NotFoundError) {
      return <div>Encounter not found</div>
    }
    return <div>Error loading encounter: {String(encounterLoader.error)}</div>
  }

  const encounterData = encounterLoader.value

  const displayName = runEffectSync(getEncounterDisplayName(encounterData))

  return (
    <ResourceDetailPage
      editTo={`/Encounter/${encounterData.id}/edit`}
      title={displayName}
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
  )
}
