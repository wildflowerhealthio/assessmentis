import { Suspense } from 'react'
import { Await } from 'react-router'

import { Practitioner } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import 'app/traits/BreadcrumbLabel/implementations/Practitioner'
import 'app/traits/Link/implementations/Practitioner'

import { useResourceSubscription } from '../layers/useResourceSubscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { PractitionerAddresses } from '../modules/forms/Practitioner/PractitionerAddresses/PractitionerAddresses'
import { PractitionerContactInfo } from '../modules/forms/Practitioner/PractitionerContactInfo/PractitionerContactInfo'
import { PractitionerLanguages } from '../modules/forms/Practitioner/PractitionerLanguages/PractitionerLanguages'
import { PractitionerQualifications } from '../modules/forms/Practitioner/PractitionerQualifications/PractitionerQualifications'
import {
  formatPractitionerDemographics,
  getPractitionerDisplayName,
} from '../modules/resources/Practitioner/utils/practitionerDisplay'
import { runEffectSyncFlat } from '../runEffectSync'
import type { Route } from './+types/Practitioner.$url._index'

export default function PractitionerDetailPage({
  params,
}: Route.ComponentProps) {
  const practitionerStream = useResourceSubscription(Practitioner, params.url)

  const practitionerPromise = useEitherStream(practitionerStream)

  useBreadcrumbs(
    () => [Practitioner, practitionerPromise],
    [practitionerPromise]
  )

  const loader = (
    <ResourceDetailPage
      editTo={`/Practitioner/${encodeURIComponent(params.url)}/edit`}
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
            editTo={`${practitioner.Link}/edit`}
            title={getPractitionerDisplayName(practitioner)}
            subtitle={`Practitioner: ${practitioner.url?.toString() ?? params.url}`}
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
