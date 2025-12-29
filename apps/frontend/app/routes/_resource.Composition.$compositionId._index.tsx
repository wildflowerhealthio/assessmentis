import { Effect, Option, Schema } from 'effect'
import {
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Composition.$compositionId._index'
import { useResourceRunEffect } from '../clientRuntime'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import {
  getCompositionDisplayName,
  formatCompositionDetails,
} from '../modules/resources/Composition/utils/compositionDisplay'
import { CompositionSections } from '../modules/resources/Composition/components/CompositionSections/CompositionSections'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

const tryDecodeCompositionId = Schema.decodeOption(CompositionId)

export default function CompositionDetailsPage({
  params,
}: Route.ComponentProps) {
  const compositionLoader = useResourceRunEffect(
    useMemo(() => {
      const compositionIdMaybe = tryDecodeCompositionId(params.compositionId)

      return Effect.gen(function* () {
        const repository = yield* CompositionRepository

        const compositionId = yield* compositionIdMaybe.pipe(
          Option.map(Effect.succeed),
          Option.getOrElse(() =>
            Effect.fail(new UnhandledError({ cause: 'Composition not found' }))
          )
        )

        return yield* repository.get(compositionId)
      })
    }, [params.compositionId])
  )

  useBreadcrumbs([
    { label: 'Compositions', href: '/Composition' },
    {
      loading: compositionLoader._tag == 'loading',
      label:
        compositionLoader._tag === 'loaded'
          ? getCompositionDisplayName(compositionLoader.value)
          : 'Unknown Composition',
      href: `/Composition/${params.compositionId}`,
    },
  ])

  if (compositionLoader._tag == 'loading') {
    return (
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
  }
  if (compositionLoader._tag === 'error') {
    throw compositionLoader.error
  }

  const composition = compositionLoader.value
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
          content: <DetailGrid items={formatCompositionDetails(composition)} />,
        },
        {
          id: 'sections',
          title: 'Sections',
          content: <CompositionSections composition={composition} />,
          hidden: !composition.section || composition.section.length === 0,
        },
      ]}
      debugData={composition}
    />
  )
}
