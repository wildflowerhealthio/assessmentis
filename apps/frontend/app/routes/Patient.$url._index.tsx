import { Suspense } from 'react'

import Skeleton from 'react-loading-skeleton'

import { runEffectSyncFlat } from '../runEffectSync'
import type { Route } from './+types/Patient.$url._index'

import 'react-loading-skeleton/dist/skeleton.css'

import { Await } from 'react-router'

import { Patient } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import 'app/traits/BreadcrumbLabel/implementations/Patient'
import 'app/traits/Link/implementations/Patient'

import { useResourceSubscription } from '../layers/useResourceSubscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { PatientAddresses } from '../modules/forms/Patient/PatientAddresses/PatientAddresses'
import { PatientContactInfo } from '../modules/forms/Patient/PatientContactInfo/PatientContactInfo'
import {
  formatPatientDemographics,
  getPatientDisplayName,
} from '../modules/resources/Patient/utils/patientDisplay'

export default function PatientDetailPage({ params }: Route.ComponentProps) {
  const patientStream = useResourceSubscription(Patient, params.url)

  const patientPromise = useEitherStream(patientStream)

  useBreadcrumbs(() => [Patient, patientPromise], [patientPromise])

  const loader = (
    <div style={{ padding: 'var(--space-4)' }}>
      <Skeleton
        width={200}
        height={32}
        style={{ marginBottom: 'var(--space-2)' }}
      />
      <Skeleton
        width={300}
        height={20}
        style={{ marginBottom: 'var(--space-4)' }}
      />
      <Skeleton width="100%" height={200} />
    </div>
  )

  return (
    <Suspense fallback={loader}>
      <Await resolve={patientPromise}>
        {(patient) => {
          const displayName = getPatientDisplayName(patient)
          const patientDemographicItems = runEffectSyncFlat(
            formatPatientDemographics(patient)
          )

          return (
            <ResourceDetailPage
              editTo={`${patient.Link}/edit`}
              title={displayName}
              subtitle={`Patient: ${patient.url?.toString() ?? params.url}`}
              sections={[
                {
                  id: 'demographics',
                  title: 'Demographics',
                  content: <DetailGrid items={patientDemographicItems} />,
                },
                {
                  id: 'contact',
                  title: 'Contact Information',
                  content: <PatientContactInfo patient={patient} />,
                  hidden: !patient.telecom || patient.telecom.length === 0,
                },
                {
                  id: 'addresses',
                  title: 'Addresses',
                  content: <PatientAddresses patient={patient} />,
                  hidden: !patient.address || patient.address.length === 0,
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
