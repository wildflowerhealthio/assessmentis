import { Effect, Schema, Option } from 'effect'
import {
  AdministrativeGender,
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { Form } from 'react-router'
import { getRuntime } from '../clientRuntime'
import PractitionerList from './Practitioner/PractitionerList'
import type { Route } from './+types/Practitioner._index'
import { useCollection } from '@assessmentis/react-util'
import { useRuntimeContext } from 'app/clientRuntime'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const practitioners = await runtime.runPromise(
    Effect.gen(function* () {
      const practitionerRepository = yield* PractitionerRepository
      return yield* practitionerRepository.getMany()
    })
  )

  return { practitioners }
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const runtime = await getRuntime()

  const givenName = formData.get('givenName')?.toString()
  const familyName = formData.get('familyName')?.toString()
  const gender = formData.get('gender')?.toString()
  const qualificationText = formData.get('qualification')?.toString()

  const newPractitioner = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* PractitionerRepository
      return yield* repository.create({
        resourceType: 'Practitioner' as const,
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
        qualification: qualificationText
          ? [
              {
                code: {
                  text: qualificationText,
                },
              },
            ]
          : undefined,
        active: true,
      })
    })
  )

  return { newPractitioner }
}

const usePractitioners = (initial: Practitioner[]) => {
  const clientRuntime = useRuntimeContext()

  return useCollection<PractitionerId, Practitioner>(
    {
      apiDelete: async (id: PractitionerId) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            PractitionerRepository.pipe(Effect.flatMap((pr) => pr.delete(id))),
          ])
        ),
      apiCreate: async (practitioner: Practitioner) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            PractitionerRepository.pipe(
              Effect.flatMap((pr) => pr.create(practitioner))
            ),
          ]).pipe(Effect.map(([, x]) => x))
        ),
    },
    initial
  )
}

export default function PractitionerPage({ loaderData }: Route.ComponentProps) {
  const { practitioners: initialPractitioners } = loaderData
  const { collection: practitioners, deleteItem: deletePractitioner } =
    usePractitioners(initialPractitioners)

  return (
    <>
      <h1 className="heading-1">Practitioners</h1>

      <PractitionerList
        deletePractitioner={deletePractitioner}
        practitioners={practitioners}
      />

      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new practitioner
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
          type="text"
          name="qualification"
          placeholder="Qualification (optional)"
          className="input-2"
        />
        <button type="submit" className="button-2 blue">
          Create Practitioner
        </button>
      </Form>
    </>
  )
}
