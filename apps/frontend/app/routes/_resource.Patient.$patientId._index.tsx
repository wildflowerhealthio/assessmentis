import { Effect, Option, Schema } from 'effect'
import {
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Patient.$patientId._index'
import { useResourceRunEffect } from '../clientRuntime'
import { useMemo } from 'react'
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
import { useBreadcrumbs } from '../modules/global/components/BreadcrumbProvider/BreadcrumbProvider'

const tryDecodePatientId = Schema.decodeOption(PatientId)

export async function clientLoader(_: Route.ClientLoaderArgs) {}

export default function PatientDetailPage({ params }: Route.ComponentProps) {
  const loadedPatient = useResourceRunEffect(
    useMemo(
      () =>
        Effect.gen(function* () {
          const patientIdMaybe = tryDecodePatientId(params.patientId)
          const repository = yield* PatientRepository

          const patientId = yield* patientIdMaybe.pipe(
            Option.map(Effect.succeed),
            Option.getOrElse(() =>
              Effect.fail(new UnhandledError({ cause: 'Patient ID not found' }))
            )
          )

          return yield* repository.get(patientId)
        }),
      [params.patientId]
    )
  )

  useBreadcrumbs(
    loadedPatient._tag === 'loaded'
      ? [
          { label: 'Patients', href: '/Patient' },
          { label: getPatientDisplayName(loadedPatient.value) },
        ]
      : [{ label: 'Patients', href: '/Patient' }, { loading: true }]
  )

  if (loadedPatient._tag === 'loading') {
    return (
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
  }

  if (loadedPatient._tag == 'error') {
    if (loadedPatient.error._tag == 'NotFoundError') {
      return <div>Couldn't find patient {params.patientId}</div>
    } else {
      throw loadedPatient.error
    }
  }

  const patient = loadedPatient.value
  const displayName = getPatientDisplayName(patient)

  return (
    <ResourceDetailPage
      editTo={`/Patient/${patient.id}/edit`}
      title={displayName}
      subtitle={`Patient ID: ${patient.id}`}
      sections={[
        {
          id: 'demographics',
          title: 'Demographics',
          content: <DetailGrid items={formatPatientDemographics(patient)} />,
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
}
