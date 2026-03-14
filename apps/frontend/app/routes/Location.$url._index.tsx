import { Suspense } from 'react'
import { Await } from 'react-router'

import { Location } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import 'app/traits/BreadcrumbLabel/implementations/Location'
import 'app/traits/Link/implementations/Location'

import { useResourceSubscription } from '../layers/useResourceSubscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { getLocationDisplayName } from '../modules/resources/Location/utils/locationDisplay'
import type { Route } from './+types/Location.$url._index'

export default function LocationDetailPage({ params }: Route.ComponentProps) {
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
      <Await resolve={locationPromise}>
        {(location) => {
          const displayName = getLocationDisplayName(location)
          const identifier = location.identifier?.[0]

          const details = [
            { label: 'Name', value: location.name ?? '-' },
            {
              label: 'Status',
              value: location.status ?? '-',
              hidden: location.status == undefined,
            },
            {
              label: 'Mode',
              value: location.mode ?? '-',
              hidden: location.mode == undefined,
            },
            {
              label: 'Description',
              value: location.description ?? '-',
              hidden: location.description == undefined,
            },
            {
              label: 'Identifier',
              value:
                identifier?.system || identifier?.value
                  ? `${identifier.system ?? ''}${
                      identifier.system && identifier.value ? ' | ' : ''
                    }${identifier.value ?? ''}`
                  : '-',
              hidden:
                identifier?.system == undefined &&
                identifier?.value == undefined,
            },
          ]

          return (
            <ResourceDetailPage
              editTo={`${location.Link}/edit`}
              title={displayName}
              subtitle={`Location: ${location.url?.toString() ?? params.url}`}
              sections={[
                {
                  id: 'details',
                  title: 'Details',
                  content: <DetailGrid items={details} />,
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
