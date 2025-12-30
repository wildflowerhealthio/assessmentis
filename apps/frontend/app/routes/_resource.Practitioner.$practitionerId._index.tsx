import { Effect, Option, Schema } from 'effect'
import {
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Practitioner.$practitionerId._index'
import { useResourceRunEffect } from '../clientRuntime'
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
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

const tryDecodePractitionerId = Schema.decodeOption(PractitionerId)

export default function PractitionerDetailPage({
  params,
}: Route.ComponentProps) {
  const practitionerLoader = useResourceRunEffect(
    useMemo(() => {
      const practitionerIdMaybe = tryDecodePractitionerId(params.practitionerId)

      return Effect.gen(function* () {
        const repository = yield* PractitionerRepository

        const practitionerId = yield* practitionerIdMaybe.pipe(
          Option.map(Effect.succeed),
          Option.getOrElse(() =>
            Effect.fail(
              new UnhandledError({ cause: 'Practitioner ID not found' })
            )
          )
        )

        return yield* repository.get(practitionerId)
      })
    }, [params.practitionerId])
  )

  useBreadcrumbs([
    { label: 'Practitioners', href: '/Practitioner' },
    {
      loading: practitionerLoader._tag === 'loading',
      label:
        practitionerLoader._tag === 'loaded'
          ? getPractitionerDisplayName(practitionerLoader.value)
          : 'Unknown Practitioner',
      href: `/Practitioner/${params.practitionerId}`,
    },
  ])

  if (practitionerLoader._tag == 'loading') {
    return (
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
  }
  if (practitionerLoader._tag === 'error') {
    throw practitionerLoader.error
  }

  const practitioner = practitionerLoader.value
  const displayName = getPractitionerDisplayName(practitioner)

  return (
    <ResourceDetailPage
      editTo={`/Practitioner/${practitioner.id}/edit`}
      title={displayName}
      subtitle={`Practitioner ID: ${practitioner.id}`}
      sections={[
        {
          id: 'demographics',
          title: 'Demographics',
          content: (
            <DetailGrid items={formatPractitionerDemographics(practitioner)} />
          ),
        },
        {
          id: 'qualifications',
          title: 'Qualifications',
          content: <PractitionerQualifications practitioner={practitioner} />,
          hidden:
            !practitioner.qualification ||
            practitioner.qualification.length === 0,
        },
        {
          id: 'contact',
          title: 'Contact Information',
          content: <PractitionerContactInfo practitioner={practitioner} />,
          hidden: !practitioner.telecom || practitioner.telecom.length === 0,
        },
        {
          id: 'addresses',
          title: 'Addresses',
          content: <PractitionerAddresses practitioner={practitioner} />,
          hidden: !practitioner.address || practitioner.address.length === 0,
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
  )
}
