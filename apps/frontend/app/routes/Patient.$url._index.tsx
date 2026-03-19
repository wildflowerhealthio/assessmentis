import { Suspense } from 'react'

import Skeleton from 'react-loading-skeleton'

import { runEffectSyncFlat } from '../run-effect-sync'
import type { Route } from './+types/Patient.$url._index'

import 'react-loading-skeleton/dist/skeleton.css'

import { Await } from 'react-router'

import { ResourceAwaitError } from '../modules/common/components/ResourceAwaitError/resource-await-error'

import { Patient } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import '../traits/BreadcrumbLabel/implementations/patient'
import '../traits/Link/implementations/patient'

import { useResourceSubscription } from '../layers/use-resource-subscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/detail-grid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/resource-detail-page'
import { PatientAddresses } from '../modules/forms/Patient/PatientAddresses/patient-addresses'
import { PatientContactInfo } from '../modules/forms/Patient/PatientContactInfo/patient-contact-info'
import {
  formatPatientDemographics,
  getPatientDisplayName,
} from '../modules/resources/Patient/utils/patient-display'

export default function PatientDetailPage({ params }: Route.ComponentProps): React.JSX.Element {
  const patientStream = useResourceSubscription(Patient, params.url)

  const patientPromise = useEitherStream(patientStream)

  useBreadcrumbs(() => [Patient, patientPromise], [patientPromise])

  const loader = (
    <div style={{ padding: 'var(--space-4)' }}>
      <Skeleton width={200} height={32} style={{ marginBottom: 'var(--space-2)' }} />
      <Skeleton width={300} height={20} style={{ marginBottom: 'var(--space-4)' }} />
      <Skeleton width="100%" height={200} />
    </div>
  )

  return (
    <Suspense fallback={loader}>
      <Await resolve={patientPromise} errorElement={<ResourceAwaitError />}>
        {(patient) => {
          const displayName = getPatientDisplayName(patient)
          const patientDemographicItems = runEffectSyncFlat(formatPatientDemographics(patient))

          return (
            <ResourceDetailPage
              editTo={`${patient.Link}/edit`}
              title={displayName}
              subtitle={`Patient: ${patient.url?.toString() ?? params.url}`}
              sections={[
                {
                  content: <DetailGrid items={patientDemographicItems} />,
                  id: 'demographics',
                  title: 'Demographics',
                },
                {
                  content: <PatientContactInfo patient={patient} />,
                  hidden: !patient.telecom || patient.telecom.length === 0,
                  id: 'contact',
                  title: 'Contact Information',
                },
                {
                  content: <PatientAddresses patient={patient} />,
                  hidden: !patient.address || patient.address.length === 0,
                  id: 'addresses',
                  title: 'Addresses',
                },
              ]}
              debugData={patient}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}
