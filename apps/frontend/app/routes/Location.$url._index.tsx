import { Suspense } from 'react'
import { Predicate } from 'effect'
import { Await } from 'react-router'

import { ResourceAwaitError } from '../modules/common/components/ResourceAwaitError/resource-await-error'

import { Location } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import '../traits/BreadcrumbLabel/implementations/location'
import '../traits/Link/implementations/location'

import { useResourceSubscription } from '../layers/use-resource-subscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/detail-grid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/resource-detail-page'
import { getLocationDisplayName } from '../modules/resources/Location/utils/location-display'
import type { Route } from './+types/Location.$url._index'

export default function LocationDetailPage({ params }: Route.ComponentProps): React.JSX.Element {
  const locationStream = useResourceSubscription(Location, params.url)

  const locationPromise = useEitherStream(locationStream)

  useBreadcrumbs(() => [Location, locationPromise], [locationPromise])

  const loader = (
    <ResourceDetailPage
      editTo={`/Location/${encodeURIComponent(params.url)}/edit`}
      title={<Skeleton width={200} />}
      subtitle={
        <>
          Location ID: <Skeleton width={100} />
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
      <Await resolve={locationPromise} errorElement={<ResourceAwaitError />}>
        {(location) => {
          const displayName = getLocationDisplayName(location)
          const identifier = location.identifier?.[0]

          const details = [
            { label: 'Name', value: location.name ?? '-' },
            {
              hidden: Predicate.isNullable(location.status) ,
              label: 'Status',
              value: location.status ?? '-',
            },
            {
              hidden: Predicate.isNullable(location.mode) ,
              label: 'Mode',
              value: location.mode ?? '-',
            },
            {
              hidden: Predicate.isNullable(location.description) ,
              label: 'Description',
              value: location.description ?? '-',
            },
            {
              hidden: Predicate.isNullable(identifier?.system) && Predicate.isNullable(identifier?.value),
              label: 'Identifier',
              value:
                identifier?.system || identifier?.value
                  ? `${identifier.system ?? ''}${
                      identifier.system && identifier.value ? ' | ' : ''
                    }${identifier.value ?? ''}`
                  : '-',
            },
          ]

          return (
            <ResourceDetailPage
              editTo={`${location.Link}/edit`}
              title={displayName}
              subtitle={`Location: ${location.url?.toString() ?? params.url}`}
              sections={[
                {
                  content: <DetailGrid items={details} />,
                  id: 'details',
                  title: 'Details',
                },
              ]}
              debugData={location}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}
