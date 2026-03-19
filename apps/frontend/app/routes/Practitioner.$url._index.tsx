import { Suspense } from 'react'
import { Await } from 'react-router'

import { Practitioner } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import '../traits/BreadcrumbLabel/implementations/practitioner'
import '../traits/Link/implementations/practitioner'

import { useResourceSubscription } from '../layers/use-resource-subscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/detail-grid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/resource-detail-page'
import { PractitionerAddresses } from '../modules/forms/Practitioner/PractitionerAddresses/practitioner-addresses'
import { PractitionerContactInfo } from '../modules/forms/Practitioner/PractitionerContactInfo/practitioner-contact-info'
import { PractitionerLanguages } from '../modules/forms/Practitioner/PractitionerLanguages/practitioner-languages'
import { PractitionerQualifications } from '../modules/forms/Practitioner/PractitionerQualifications/practitioner-qualifications'
import {
  formatPractitionerDemographics,
  getPractitionerDisplayName,
} from '../modules/resources/Practitioner/utils/practitioner-display'
import { runEffectSyncFlat } from '../run-effect-sync'
import type { Route } from './+types/Practitioner.$url._index'

export default function PractitionerDetailPage({
  params,
}: Route.ComponentProps): React.JSX.Element {
  const practitionerStream = useResourceSubscription(Practitioner, params.url)

  const practitionerPromise = useEitherStream(practitionerStream)

  useBreadcrumbs(() => [Practitioner, practitionerPromise], [practitionerPromise])

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
          content: (
            <DetailGrid
              items={{
                skeleton: [<Skeleton key={0} />, <Skeleton key={1} />, <Skeleton key={2} />],
              }}
            />
          ),
          id: 'demographics',
          title: 'Demographics',
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
                content: (
                  <DetailGrid
                    items={runEffectSyncFlat(formatPractitionerDemographics(practitioner))}
                  />
                ),
                id: 'demographics',
                title: 'Demographics',
              },
              {
                content: <PractitionerQualifications practitioner={practitioner} />,
                hidden: !practitioner.qualification || practitioner.qualification.length === 0,
                id: 'qualifications',
                title: 'Qualifications',
              },
              {
                content: <PractitionerContactInfo practitioner={practitioner} />,
                hidden: !practitioner.telecom || practitioner.telecom.length === 0,
                id: 'contact',
                title: 'Contact Information',
              },
              {
                content: <PractitionerAddresses practitioner={practitioner} />,
                hidden: !practitioner.address || practitioner.address.length === 0,
                id: 'addresses',
                title: 'Addresses',
              },
              {
                content: <PractitionerLanguages practitioner={practitioner} />,
                hidden: !practitioner.communication || practitioner.communication.length === 0,
                id: 'languages',
                title: 'Languages',
              },
            ]}
            debugData={practitioner}
          />
        )}
      </Await>
    </Suspense>
  )
}
