import { Effect, Option, Schema } from 'effect'
import { useNavigate } from 'react-router'
import { useLoadedRuntimeContext } from 'app/clientRuntime'
import { getRuntime } from 'app/clientRuntime'
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
import { useBreadcrumbs } from '../modules/global/components/BreadcrumbProvider/BreadcrumbProvider'
import { getPatientDisplayName } from '../modules/resources/Patient/utils/patientDisplay'

const tryDecodePatientId = Schema.decodeOption(PatientId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const patientIdMaybe = tryDecodePatientId(params.patientId)

  const patient = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PatientRepository

      const patientId = yield* patientIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(new UnhandledError({ cause: 'Patient ID not found' }))
        )
      )

      return yield* repository.get(patientId)
    })
  )

  return { patient }
}

export default function EditPatientPage({ loaderData }: Route.ComponentProps) {
  const { patient } = loaderData
  const navigate = useNavigate()
  const clientRuntime = useLoadedRuntimeContext()

  useBreadcrumbs([
    { label: 'Patients', href: '/Patient' },
    { label: getPatientDisplayName(patient), href: `/Patient/${patient.id}` },
    { label: 'Edit' },
  ])

  // Transform patient to form initial values
  const initialValues: PatientFormData = {
    givenName: patient.name?.[0]?.given?.[0] ?? '',
    familyName: patient.name?.[0]?.family ?? '',
    gender: patient.gender,
    birthDate: patient.birthDate,
    practitionerId: patient.generalPractitioner?.[0]?.reference?.split('/')[1],
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
