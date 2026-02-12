import type { Scope } from 'effect'
import { Either, Option, Schema, Stream } from 'effect'
import type { LocationId } from '@assessmentis/clinical-domain/administration'
import { EncounterId } from '@assessmentis/clinical-domain/administration'
import type { FullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import { getFullEncounter } from 'app/modules/interview-call/actions/getFullEncounter'
import InterviewCall from 'app/modules/interview-call/features/InterviewCall/InterviewCall'
import type { Route } from './+types/Encounter.$encounterId._index'
import { runEffectSync } from '../runEffectSync'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import { Suspense, useMemo } from 'react'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  UnhandledError,
} from '@assessmentis/ontology'
import { NotFoundError } from '@assessmentis/ontology'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { useEitherStream } from '@assessmentis/react-util'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await, useAsyncError } from 'react-router'
import type { NoSelectedOrgError } from '../../../../domain/platform-domain/src/hostedServices'

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

  const encounterStream = useMemo(() => {
    const encounterIdStr = params.encounterId
    const encounterIdMaybe = tryDecodeEncounterId(encounterIdStr)
    return Option.match<
      EncounterId,
      Stream.Stream<
        Either.Either<
          FullEncounter,
          | UnhandledError
          | AuthError
          | AuthzError
          | NotFoundError<'Encounter', { id: EncounterId }>
          | NotFoundError<'Location', { id: LocationId }>
          | ExternalAssertionError
          | NoSelectedOrgError
        >,
        never,
        Scope.Scope
      >
    >(encounterIdMaybe, {
      onSome(encounterId) {
        return getFullEncounter(encounterId).pipe(
          Stream.provideService(
            ClinicalDataRepositoryService,
            clinicalDataRepositoryService
          )
        )
      },
      onNone() {
        return Stream.succeed(
          Either.left(
            new NotFoundError({
              resourceType: 'Encounter',
              params: { id: EncounterId.make(encounterIdStr) },
            })
          )
        )
      },
    })
  }, [params.encounterId, clinicalDataRepositoryService])

  const encounterPromise = useEitherStream(encounterStream)

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
