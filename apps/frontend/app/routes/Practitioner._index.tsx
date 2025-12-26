import { Effect } from 'effect'
import {
  Practitioner,
  PractitionerId,
  PractitionerRepository,
} from '@assessmentis/clinical-domain/administration'
import { getRuntime } from '../clientRuntime'
import PractitionerList from '../modules/practitioner/components/PractitionerList'
import type { Route } from './+types/Practitioner._index'
import { useCollection } from '@assessmentis/react-util'
import { useRuntimeContext } from 'app/clientRuntime'
import {
  ResourceForm,
  SelectField,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import {
  PractitionerFormSchema,
  transformToPractitioner,
} from 'app/modules/practitioner/schemas/PractitionerFormSchema'
import { applyPartialProps } from '@assessmentis/react-util'

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
  const clientRuntime = useRuntimeContext()

  const handleCreatePractitioner = async (
    formData: typeof PractitionerFormSchema.Type
  ) => {
    const practitioner = transformToPractitioner(formData)

    await clientRuntime.runPromise(
      Effect.gen(function* () {
        const repository = yield* PractitionerRepository
        return yield* repository.create(practitioner)
      })
    )

    // Reload to show new practitioner
    window.location.reload()
  }

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

      <div style={{ marginTop: 'var(--space-4)' }}>
        <ResourceForm<
          typeof PractitionerFormSchema.Type,
          typeof PractitionerFormSchema.Encoded
        >
          schema={PractitionerFormSchema}
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
            qualification: applyPartialProps(TextField, {
              name: 'qualification',
              label: 'Qualification',
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
          }}
          fieldOrder={['givenName', 'familyName', 'gender', 'qualification']}
          onSubmit={handleCreatePractitioner}
          submitLabel="Create Practitioner"
        />
      </div>
    </>
  )
}
