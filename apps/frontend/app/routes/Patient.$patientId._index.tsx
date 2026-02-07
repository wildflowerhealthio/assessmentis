import { Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { PatientId } from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Patient.$patientId._index'
import { runEffectSyncFlat } from '../runEffectSync'
import { useMemo, Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { PatientContactInfo } from '../modules/resources/Patient/components/PatientContactInfo/PatientContactInfo'
import { PatientAddresses } from '../modules/resources/Patient/components/PatientAddresses/PatientAddresses'
import {
  getPatientDisplayName,
  formatPatientDemographics,
} from '../modules/resources/Patient/utils/patientDisplay'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await } from 'react-router'

const tryDecodePatientId = Schema.decodeOption(PatientId)

export default function PatientDetailPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const patientStream = useMemo(() => {
    const patientIdMaybe = tryDecodePatientId(params.patientId)

    return Option.match(patientIdMaybe, {
      onSome: (patientId) =>
        clinicalDataRepositoryService.stream.Patient.pipe(
          StreamEither.mapEffect((repo) => repo.get(patientId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(new UnhandledError({ message: 'Patient ID not found' }))
        ),
    })
  }, [clinicalDataRepositoryService, params.patientId])

  const patientPromise = useEitherStream(patientStream)

  const breadcrumbs = useMemo(
    () => [
      { label: 'Patients', href: '/Patient' },
      patientPromise.then((patient) => ({
        label: getPatientDisplayName(patient),
      })),
    ],
    [patientPromise]
  )

  useBreadcrumbs(breadcrumbs)

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
              editTo={`/Patient/${patient.id}/edit`}
              title={displayName}
              subtitle={`Patient ID: ${patient.id}`}
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
