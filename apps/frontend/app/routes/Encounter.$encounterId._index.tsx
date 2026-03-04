import { Either, Option, Schema, Stream, type Scope } from 'effect'
import { Suspense, useMemo } from 'react'
import { Await, useAsyncError } from 'react-router'

import { Encounter } from '@assessmentis/clinical-domain'
import type { ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import {
  NotFoundError,
  type AuthError,
  type AuthzError,
  type ExternalAssertionError,
  type UnhandledError,
} from '@assessmentis/ontology'
import { useEitherStream } from '@assessmentis/react-util'

import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import {
  getFullEncounter,
  type FullEncounter,
} from 'app/modules/interview-call/actions/getFullEncounter'
import InterviewCall from 'app/modules/interview-call/features/InterviewCall/InterviewCall'

import type { NoSelectedOrgError } from '../../../../domain/platform-domain/src/hostedServices'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { getEncounterDisplayName } from '../modules/resources/Encounter/utils/encounterDisplay'
import { runEffectSync } from '../runEffectSync'
import type { Route } from './+types/Encounter.$encounterId._index'

const tryDecodeEncounterUrl = Schema.decodeOption(Encounter.UrlSchema)

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
    const encounterUrl = params.encounterId
    const encounterUrlMaybe = tryDecodeEncounterUrl(encounterUrl)
    return Option.match<
      Resource.InferResourceUrl<Encounter>,
      Stream.Stream<
        Either.Either<
          FullEncounter,
          | UnhandledError
          | AuthError
          | AuthzError
          | NotFoundError<'Encounter', { readonly url: ReadonlyUrl | string }>
          | NotFoundError<'Location', { readonly url: ReadonlyUrl | string }>
          | ExternalAssertionError
          | NoSelectedOrgError
        >,
        never,
        Scope.Scope
      >
    >(encounterUrlMaybe, {
      onSome(encounterUrl) {
        return getFullEncounter(encounterUrl).pipe(
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
              params: { url: encounterUrl },
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
        label: runEffectSync(getEncounterDisplayName(enc.encounter)),
      })),
    ]
  }, [encounterPromise])

  useBreadcrumbs(breadcrumbs)

  return (
    <Suspense fallback={<div>Loading interview call...</div>}>
      <Await resolve={encounterPromise} errorElement={<EncounterError />}>
        {(encounterData) => (
          <ResourceDetailPage
            editTo={`/Encounter/${encounterData.encounter.url?.toString() ?? params.encounterId}/edit`}
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
