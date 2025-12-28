import { Effect } from 'effect'
import {
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { getRuntime } from '../clientRuntime'
import PatientList from '../modules/resources/Patient/components/PatientList'
import type { Route } from './+types/Patient._index'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import { useRuntimeContext } from 'app/clientRuntime'
import { PractitionerPicker } from '../modules/resources/Practitioner/components/PractitionerPicker'
import {
  ResourceForm,
  SelectField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import {
  PatientFormSchema,
  transformToPatient,
} from 'app/modules/resources/Patient/schemas/PatientFormSchema'
import { CommonFieldProps } from '../modules/common/components/ResourceForm/ResourceForm'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const patients = await runtime.runPromise(
    Effect.gen(function* () {
      const patientRepository = yield* PatientRepository
      return yield* patientRepository.getMany()
    })
  )

  return { patients }
}

const usePatients = (initial: Patient[]) => {
  return useClinicalDataCollection<
    PatientId,
    Patient,
    PatientRepository,
    typeof PatientRepository
  >(PatientRepository, initial)
}

export default function PatientPage({ loaderData }: Route.ComponentProps) {
  const { patients: initialPatients } = loaderData
  const { collection: patients, deleteItem: deletePatient } =
    usePatients(initialPatients)
  const clientRuntime = useRuntimeContext()

  const handleCreatePatient = async (
    formData: typeof PatientFormSchema.Type
  ) => {
    const patient = transformToPatient(formData)

    await clientRuntime.runPromise(
      Effect.gen(function* () {
        const repository = yield* PatientRepository
        return yield* repository.create(patient)
      })
    )

    // Reload to show new patient
    window.location.reload()
  }

  return (
    <>
      <h1 className="heading-1">Patients</h1>

      <PatientList deletePatient={deletePatient} patients={patients} />

      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new patient
      </h2>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <ResourceForm
          schema={PatientFormSchema}
          fields={{
            givenName: applyPartialProps(TextField, {
              name: 'givenName',
              label: 'Given Name',
              required: true,
            }),
            familyName: applyPartialProps(TextField, {
              name: 'familyName',
              label: 'Family Name',
              required: true,
            }),
            gender: applyPartialProps(SelectField, {
              name: 'gender',
              label: 'Gender',
              options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
                { value: 'unknown', label: 'Unknown' },
              ],
            }),
            birthDate: applyPartialProps(TextField, {
              name: 'birthDate',
              label: 'Birth Date',
            }),
            practitionerId: transformProps(
              PractitionerPicker,
              (props: CommonFieldProps<string | undefined>) => ({
                name: 'practitionerId',
                label: 'General Practitioner',
                picking: {
                  onChange: props.onChange,
                  value: props.value,
                  multiple: false as const,
                },
              })
            ),
          }}
          fieldOrder={[
            'givenName',
            'familyName',
            'gender',
            'birthDate',
            'practitionerId',
          ]}
          onSubmit={handleCreatePatient}
          submitLabel="Create Patient"
        />
      </div>
    </>
  )
}
