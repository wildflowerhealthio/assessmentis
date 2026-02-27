import { Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Composition.$compositionId._index'
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
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await } from 'react-router'

const tryDecodeCompositionId = Schema.decodeOption(Schema.String)

export default function CompositionDetailsPage({
  params,
}: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()
  const compositionStream = useMemo(() => {
    const compositionIdMaybe = tryDecodeCompositionId(params.compositionId)

    return Option.match(compositionIdMaybe, {
      onSome: (compositionId) =>
        clinicalDataRepositoryService.stream.Composition.pipe(
          StreamEither.mapEffect((repo) => repo.get(compositionId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(
            new UnhandledError({
              message: 'Composition ID not found',
            })
          )
        ),
    })
  }, [params.compositionId, clinicalDataRepositoryService])

  const compositionLoader = useEitherStream(compositionStream)

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
              editTo={`/Composition/${composition.url?.toString() ?? params.compositionId}/edit`}
              title={displayName}
              subtitle={`Composition: ${composition.url?.toString() ?? params.compositionId}`}
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
