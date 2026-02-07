import { Effect, Either, Option, Schema, Stream } from 'effect'
import { useNavigate } from 'react-router'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PatientForm } from 'app/modules/resources/Patient/components/PatientForm'
import { updatePatient } from 'app/modules/resources/Patient/actions/updatePatient'
import { PatientFormData } from 'app/modules/resources/Patient/schemas/PatientFormSchema'
import { PatientId } from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Patient.$patientId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getPatientDisplayName } from '../modules/resources/Patient/utils/patientDisplay'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import { ClinicalDataRepositoryService } from '../layers/ClinicalDataRepositoriesService'
import { usePlatformContext } from '../layers/PlatformContext'
import { useEitherStream } from '@assessmentis/react-util'

const tryDecodePatientId = Schema.decodeOption(PatientId)

export default function EditPatientPage({ params }: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const patientStream = useMemo(() => {
    const patientIdMaybe = tryDecodePatientId(params.patientId)

    return Option.match(patientIdMaybe, {
      onSome: (patientId) =>
        clinicalDataRepositoryService.stream.Patient.pipe(
          Stream.mapEffect((repoEither) =>
            Effect.either(
              Effect.flatMap(repoEither, (repo) => repo.get(patientId))
            )
          )
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(new UnhandledError({ message: 'Patient ID not found' }))
        ),
    })
  }, [clinicalDataRepositoryService, params.patientId])

  const patientPromise = useEitherStream(patientStream)

  const navigate = useNavigate()

  const breadcrumbs = useMemo(
    () => [
      { label: 'Patients', href: '/Patient' },
      patientPromise.then((p) => ({
        label: getPatientDisplayName(p),
        href: `/Patient/${params.patientId}`,
      })),
      { label: 'Edit' },
    ],
    [patientPromise, params.patientId]
  )

  useBreadcrumbs(breadcrumbs)

  // Transform patient to form initial values
  const initialValues: Promise<PatientFormData> = useMemo(
    () =>
      patientPromise.then((patient) => ({
        givenName: patient.name?.[0]?.given?.[0] ?? '',
        familyName: patient.name?.[0]?.family ?? '',
        gender: patient.gender,
        birthDate: patient.birthDate,
        practitionerId: extractReferenceId(patient.generalPractitioner?.[0]),
      })),
    [patientPromise]
  )

  const handleSubmit = async (formData: PatientFormData) => {
    const patient = await patientPromise

    await Effect.runPromise(
      updatePatient(patient.id, patient, formData).pipe(
        Effect.provideService(
          ClinicalDataRepositoryService,
          clinicalDataRepositoryService
        )
      )
    )

    // Redirect back to detail page
    navigate(`/Patient/${patient.id}`)
  }

  return (
    <FormPage title="Edit Patient">
      <PatientForm
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        initialValues={initialValues}
      />
    </FormPage>
  )
}
