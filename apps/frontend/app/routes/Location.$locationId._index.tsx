import { Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { LocationId } from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Location.$locationId._index'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { getLocationDisplayName } from '../modules/resources/Location/utils/locationDisplay'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Suspense, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await } from 'react-router'

const tryDecodeLocationId = Schema.decodeOption(LocationId)

export default function LocationDetailPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const locationStream = useMemo(() => {
    const locationIdMaybe = tryDecodeLocationId(params.locationId)

    return Option.match(locationIdMaybe, {
      onSome: (locationId) =>
        clinicalDataRepositoryService.stream.Location.pipe(
          StreamEither.mapEffect((repo) => repo.get(locationId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(new UnhandledError({ message: 'Location ID not found' }))
        ),
    })
  }, [clinicalDataRepositoryService, params.locationId])

  const locationPromise = useEitherStream(locationStream)

  const breadcrumbs = useMemo(
    () => [
      { label: 'Locations', href: '/Location' },
      locationPromise.then((location) => ({
        label: getLocationDisplayName(location),
        href: `/Location/${params.locationId}`,
      })),
    ],
    [locationPromise, params.locationId]
  )

  useBreadcrumbs(breadcrumbs)

  const loader = (
    <ResourceDetailPage
      editTo={`/Location/${params.locationId}/edit`}
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
              editTo={`/Location/${location.id}/edit`}
              title={displayName}
              subtitle={`Location ID: ${location.id}`}
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
