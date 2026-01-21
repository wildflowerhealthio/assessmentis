import { Effect, Option, Schema } from 'effect'
import {
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Composition.$compositionId._index'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import {
  getCompositionDisplayName,
  formatCompositionDetails,
} from '../modules/resources/Composition/utils/compositionDisplay'
import { CompositionSections } from '../modules/resources/Composition/components/CompositionSections/CompositionSections'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Suspense, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useEffectTs } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await } from 'react-router'

const tryDecodeCompositionId = Schema.decodeOption(CompositionId)

export default function CompositionDetailsPage({
  params,
}: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()
  const compositionEffect = useMemo(() => {
    const compositionIdMaybe = tryDecodeCompositionId(params.compositionId)

    return Effect.gen(function* () {
      const repository = yield* CompositionRepository

      const compositionId = yield* compositionIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(new UnhandledError({ message: 'Composition not found' }))
        )
      )

      return yield* repository.get(compositionId)
    }).pipe(
      Effect.provideServiceEffect(
        CompositionRepository,
        clinicalDataRepositoryService.Composition
      )
    )
  }, [params.compositionId, clinicalDataRepositoryService.Composition])

  const compositionLoader = useEffectTs(compositionEffect)

  const crumbs = useMemo(
    () => [
      { label: 'Compositions', href: '/Composition' },
      compositionLoader.then((c) => ({
        label: getCompositionDisplayName(c),
        href: `/Composition/${params.compositionId}`,
      })),
    ],
    [compositionLoader, params.compositionId]
  )

  useBreadcrumbs(crumbs)

  const loader = (
    <ResourceDetailPage
      editTo={`/Composition/${params.compositionId}/edit`}
      title={<Skeleton width={200} />}
      subtitle={
        <>
          Composition ID: <Skeleton width={100} />
        </>
      }
      sections={[
        {
          id: 'details',
          title: 'Details',
          content: (
            <DetailGrid
              items={{ skeleton: [<Skeleton />, <Skeleton />, <Skeleton />] }}
            />
          ),
        },
      ]}
    />
  )

  return (
    <Suspense fallback={loader}>
      <Await resolve={compositionLoader}>
        {(composition) => {
          const displayName = getCompositionDisplayName(composition)
          return (
            <ResourceDetailPage
              editTo={`/Composition/${composition.id}/edit`}
              title={displayName}
              subtitle={`Composition ID: ${composition.id}`}
              sections={[
                {
                  id: 'details',
                  title: 'Details',
                  content: (
                    <DetailGrid items={formatCompositionDetails(composition)} />
                  ),
                },
                {
                  id: 'sections',
                  title: 'Sections',
                  content: <CompositionSections composition={composition} />,
                  hidden:
                    !composition.section || composition.section.length === 0,
                },
              ]}
              debugData={composition}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}
