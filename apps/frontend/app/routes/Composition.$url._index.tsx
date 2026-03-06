import { Suspense } from 'react'
import { Await } from 'react-router'

import { Composition } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import 'app/traits/BreadcrumbLabel/implementations/Composition'
import 'app/traits/Link/implementations/Composition'

import { useResourceSubscription } from '../layers/useResourceSubscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { CompositionSections } from '../modules/forms/Composition/CompositionSections/CompositionSections'
import {
  formatCompositionDetails,
  getCompositionDisplayName,
} from '../modules/resources/Composition/utils/compositionDisplay'
import type { Route } from './+types/Composition.$url._index'

export default function CompositionDetailsPage({
  params,
}: Route.ComponentProps) {
  const compositionStream = useResourceSubscription(Composition, params.url)

  const compositionLoader = useEitherStream(compositionStream)

  useBreadcrumbs(Composition, compositionLoader)

  const loader = (
    <ResourceDetailPage
      editTo={`/Composition/${encodeURIComponent(params.url)}/edit`}
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
              editTo={`${composition.Link}/edit`}
              title={displayName}
              subtitle={`Composition: ${composition.url?.toString() ?? params.url}`}
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
