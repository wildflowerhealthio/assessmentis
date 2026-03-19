import { Suspense } from 'react'
import { Await } from 'react-router'

import { Composition } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Link/implementations/composition'
/* eslint-enable import/no-unassigned-import */

import { useResourceSubscription } from '../layers/use-resource-subscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/detail-grid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/resource-detail-page'
import { CompositionSections } from '../modules/forms/Composition/CompositionSections/composition-sections'
import {
  formatCompositionDetails,
  getCompositionDisplayName,
} from '../modules/resources/Composition/utils/composition-display'
import type { Route } from './+types/Composition.$url._index'

export default function CompositionDetailsPage({
  params,
}: Route.ComponentProps): React.JSX.Element {
  const compositionStream = useResourceSubscription(Composition, params.url)

  const compositionLoader = useEitherStream(compositionStream)

  useBreadcrumbs(() => [Composition, compositionLoader], [compositionLoader])

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
          content: (
            <DetailGrid
              items={{
                skeleton: [<Skeleton key={0} />, <Skeleton key={1} />, <Skeleton key={2} />],
              }}
            />
          ),
          id: 'details',
          title: 'Details',
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
                  content: <DetailGrid items={formatCompositionDetails(composition)} />,
                  id: 'details',
                  title: 'Details',
                },
                {
                  content: <CompositionSections composition={composition} />,
                  hidden: !composition.section || composition.section.length === 0,
                  id: 'sections',
                  title: 'Sections',
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
