import { Effect, Schema, Option } from 'effect'
import {
  AdministrativeGender,
  Patient,
  PatientId,
  PatientRepository,
} from '@assessmentis/clinical-domain/administration'
import { Form } from 'react-router'
import { getRuntime } from '../clientRuntime'
import PatientList from '../modules/patient/components/PatientList'
import type { Route } from './+types/Patient._index'
import { useCollection } from '@assessmentis/react-util'
import { useRuntimeContext } from 'app/clientRuntime'

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

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const runtime = await getRuntime()

  const givenName = formData.get('givenName')?.toString()
  const familyName = formData.get('familyName')?.toString()
  const gender = formData.get('gender')?.toString()
  const birthDate = formData.get('birthDate')?.toString()

  const newPatient = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PatientRepository
      return yield* repository.create({
        resourceType: 'Patient' as const,
        name:
          givenName || familyName
            ? [
                {
                  given: givenName ? [givenName] : undefined,
                  family: familyName,
                },
              ]
            : undefined,
        gender: Schema.decodeUnknownOption(AdministrativeGender)(gender).pipe(
          Option.getOrElse(() => 'unknown' as const)
        ),
        birthDate,
        active: true,
      })
    })
  )

  return { newPatient }
}

const usePatients = (initial: Patient[]) => {
  const clientRuntime = useRuntimeContext()

  return useCollection<PatientId, Patient>(
    {
      apiDelete: async (id: PatientId) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            PatientRepository.pipe(Effect.flatMap((pr) => pr.delete(id))),
          ])
        ),
      apiCreate: async (patient: Patient) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            PatientRepository.pipe(Effect.flatMap((pr) => pr.create(patient))),
          ]).pipe(Effect.map(([, x]) => x))
        ),
    },
    initial
  )
}

export default function PatientPage({ loaderData }: Route.ComponentProps) {
  const { patients: initialPatients } = loaderData
  const { collection: patients, deleteItem: deletePatient } =
    usePatients(initialPatients)

  return (
    <>
      <h1 className="heading-1">Patients</h1>

      <PatientList deletePatient={deletePatient} patients={patients} />

      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new patient
      </h2>

      <Form
        method="post"
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          marginTop: 'var(--space-4)',
        }}
      >
        <input
          type="text"
          name="givenName"
          placeholder="Given Name"
          className="input-2"
          required
        />
        <input
          type="text"
          name="familyName"
          placeholder="Family Name"
          className="input-2"
          required
        />
        <select name="gender" className="input-2">
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="unknown">Unknown</option>
        </select>
        <input
          type="date"
          name="birthDate"
          placeholder="Birth Date"
          className="input-2"
        />
        <button type="submit" className="button-2 blue">
          Create Patient
        </button>
      </Form>
    </>
  )
}
