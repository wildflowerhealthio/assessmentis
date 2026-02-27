import { Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Practitioner.$practitionerId._index'
import { runEffectSyncFlat } from '../runEffectSync'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import {
  getPractitionerDisplayName,
  formatPractitionerDemographics,
} from '../modules/resources/Practitioner/utils/practitionerDisplay'
import { PractitionerQualifications } from '../modules/resources/Practitioner/components/PractitionerQualifications/PractitionerQualifications'
import { PractitionerContactInfo } from '../modules/resources/Practitioner/components/PractitionerContactInfo/PractitionerContactInfo'
import { PractitionerAddresses } from '../modules/resources/Practitioner/components/PractitionerAddresses/PractitionerAddresses'
import { PractitionerLanguages } from '../modules/resources/Practitioner/components/PractitionerLanguages/PractitionerLanguages'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { Suspense, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await } from 'react-router'

const tryDecodePractitionerId = Schema.decodeOption(Schema.String)

export default function PractitionerDetailPage({
  params,
}: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const practitionerStream = useMemo(() => {
    const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

    return Option.match(practitionerIdMaybe, {
      onSome: (practitionerId) =>
        clinicalDataRepositoryService.stream.Practitioner.pipe(
          StreamEither.mapEffect((repo) => repo.get(practitionerId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(
            new UnhandledError({ message: 'Practitioner ID not found' })
          )
        ),
    })
  }, [clinicalDataRepositoryService, params.practitionerId])

  const practitionerPromise = useEitherStream(practitionerStream)

  const breadcrumbs = useMemo(
    () => [
      { label: 'Practitioners', href: '/Practitioner' },
      practitionerPromise.then((practitioner) => ({
        label: getPractitionerDisplayName(practitioner),
        href: `/Practitioner/${params.practitionerId}`,
      })),
    ],
    [practitionerPromise, params.practitionerId]
  )

  useBreadcrumbs(breadcrumbs)

  const loader = (
    <ResourceDetailPage
      editTo={`/Practitioner/${params.practitionerId}/edit`}
      title={<Skeleton width={200} />}
      subtitle={
        <>
          Practitioner ID: <Skeleton width={100} />
        </>
      }
      sections={[
        {
          id: 'demographics',
          title: 'Demographics',
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
      <Await resolve={practitionerPromise}>
        {(practitioner) => (
          <ResourceDetailPage
            editTo={`/Practitioner/${practitioner.url?.toString() ?? params.practitionerId}/edit`}
            title={getPractitionerDisplayName(practitioner)}
            subtitle={`Practitioner: ${practitioner.url?.toString() ?? params.practitionerId}`}
            sections={[
              {
                id: 'demographics',
                title: 'Demographics',
                content: (
                  <DetailGrid
                    items={runEffectSyncFlat(
                      formatPractitionerDemographics(practitioner)
                    )}
                  />
                ),
              },
              {
                id: 'qualifications',
                title: 'Qualifications',
                content: (
                  <PractitionerQualifications practitioner={practitioner} />
                ),
                hidden:
                  !practitioner.qualification ||
                  practitioner.qualification.length === 0,
              },
              {
                id: 'contact',
                title: 'Contact Information',
                content: (
                  <PractitionerContactInfo practitioner={practitioner} />
                ),
                hidden:
                  !practitioner.telecom || practitioner.telecom.length === 0,
              },
              {
                id: 'addresses',
                title: 'Addresses',
                content: <PractitionerAddresses practitioner={practitioner} />,
                hidden:
                  !practitioner.address || practitioner.address.length === 0,
              },
              {
                id: 'languages',
                title: 'Languages',
                content: <PractitionerLanguages practitioner={practitioner} />,
                hidden:
                  !practitioner.communication ||
                  practitioner.communication.length === 0,
              },
            ]}
            debugData={practitioner}
          />
        )}
      </Await>
    </Suspense>
  )
}
