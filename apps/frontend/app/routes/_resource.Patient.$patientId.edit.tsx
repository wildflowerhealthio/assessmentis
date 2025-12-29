import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import {
  useLoadedRuntimeContext,
  useResourceRunEffect,
} from 'app/clientRuntime'
import { FormPage } from 'app/modules/common/components/FormPage/FormPage'
import { PatientForm } from 'app/modules/resources/Patient/components/PatientForm'
import { updatePatient } from 'app/modules/resources/Patient/actions/updatePatient'
import { PatientFormData } from 'app/modules/resources/Patient/schemas/PatientFormSchema'
import {
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Patient.$patientId.edit'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { getPatientDisplayName } from '../modules/resources/Patient/utils/patientDisplay'
import { extractReferenceId } from 'app/modules/common/utils/fhirDisplay'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

const tryDecodePatientId = Schema.decodeOption(PatientId)

export default function EditPatientPage({ params }: Route.ComponentProps) {
  const patientLoader = useResourceRunEffect(
    useMemo(() => {
      const patientIdMaybe = tryDecodePatientId(params.patientId)

      return Effect.gen(function* () {
        const repository = yield* PatientRepository

        const patientId = yield* patientIdMaybe.pipe(
          Option.map(Effect.succeed),
          Option.getOrElse(() =>
            Effect.fail(new UnhandledError({ cause: 'Patient ID not found' }))
          )
        )

        return yield* repository.get(patientId)
      })
    }, [params.patientId])
  )

  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  useBreadcrumbs([
    { label: 'Patients', href: '/Patient' },
    {
      loading: patientLoader._tag === 'loading',
      label:
        patientLoader._tag === 'loaded'
          ? getPatientDisplayName(patientLoader.value)
          : 'Unknown Patient',
      href: `/Patient/${params.patientId}`,
    },
    { label: 'Edit' },
  ])

  if (patientLoader._tag == 'loading') {
    return (
      <FormPage title="Edit Patient">
        <Skeleton count={5} height={40} style={{ marginBottom: '1rem' }} />
      </FormPage>
    )
  }
  if (patientLoader._tag === 'error') {
    throw patientLoader.error
  }

  const patient = patientLoader.value

  // Transform patient to form initial values
  const initialValues: PatientFormData = {
    givenName: patient.name?.[0]?.given?.[0] ?? '',
    familyName: patient.name?.[0]?.family ?? '',
    gender: patient.gender,
    birthDate: patient.birthDate,
    practitionerId: extractReferenceId(patient.generalPractitioner?.[0]),
  }

  const handleSubmit = async (formData: PatientFormData) => {
    if (!patient.id) return

    if (clientRuntime._tag != 'loaded') {
      console.error('Runtime not loaded', clientRuntime)
      return
    }

    await clientRuntime.value.runPromise(
      updatePatient(patient.id, patient, formData)
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
