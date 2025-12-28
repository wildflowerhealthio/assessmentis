import { Effect } from 'effect'
import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { useRuntimeContext } from 'app/clientRuntime'
import { applyPartialProps, transformProps } from '@assessmentis/react-util'
import type { Route } from './+types/Composition._index'
import CompositionList from '../modules/resources/Composition/components/CompositionList'
import { getRuntime } from '../clientRuntime'
import { PatientPicker } from '../modules/resources/Patient/components/PatientPicker'
import {
  DateField,
  ResourceForm,
  TextField,
} from 'app/modules/common/components/ResourceForm'
import {
  CompositionFormSchema,
  transformToComposition,
} from 'app/modules/resources/Composition/schemas/CompositionFormSchema'
import { CommonFieldProps } from '../modules/common/components/ResourceForm/ResourceForm'
import { useClinicalDataCollection } from '../modules/common/hooks/useClinicalDataCollection'
import { LoadedResult } from '../../../../global/ontology/src/LoadedResult'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()

  const compositions = await runtime.runPromise(
    Effect.gen(function* () {
      const compositionRepository = yield* CompositionRepository
      return yield* compositionRepository.getMany()
    })
  )

  return { compositions }
}

const useCompositions = (initial: Composition[]) => {
  return useClinicalDataCollection<
    CompositionId,
    Composition,
    CompositionRepository,
    typeof CompositionRepository,
    never
  >(CompositionRepository, LoadedResult.loaded(initial))
}

export default function CompositionPage({ loaderData }: Route.ComponentProps) {
  const { collection: compositions, deleteItem: deleteComposition } =
    useCompositions(loaderData.compositions)
  const clientRuntime = useRuntimeContext()

  const handleCreateComposition = async (
    formData: typeof CompositionFormSchema.Type
  ) => {
    const composition = transformToComposition(formData)

    await clientRuntime.runPromise(
      Effect.gen(function* () {
        const repository = yield* CompositionRepository
        return yield* repository.create(composition)
      })
    )

    // Reload to show new composition
    window.location.reload()
  }

  return (
    <>
      <h1 className="heading-1">Compositions</h1>

      {LoadedResult.handle(compositions, {
        onLoading: () => <p>Loading compositions...</p>,
        onError: (error) =>
          error == null ? (
            <p style={{ color: 'var(--color-error)' }}>
              Error loading compositions
            </p>
          ) : (
            <p style={{ color: 'var(--color-error)' }}>
              Error loading compositions: {JSON.stringify(error, null, 2)}
            </p>
          ),
        onSuccess: (data) => (
          <CompositionList
            compositions={data}
            deleteComposition={deleteComposition}
          />
        ),
      })}
      <h2 className="heading-3" style={{ marginTop: 'var(--space-7)' }}>
        Create a new composition
      </h2>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <ResourceForm
          schema={CompositionFormSchema}
          fields={{
            title: applyPartialProps(TextField, {
              name: 'title',
              label: 'Title',
              required: true,
            }),
            patientId: transformProps(
              PatientPicker,
              (props: CommonFieldProps<string | undefined>) => ({
                name: 'patientId',
                label: 'Subject (Patient)',
                picking: {
                  onChange: props.onChange,
                  value: props.value,
                  multiple: false as const,
                },
              })
            ),

            date: applyPartialProps(DateField, { name: 'date', label: 'Date' }),
          }}
          fieldOrder={['title', 'patientId', 'date']}
          onSubmit={handleCreateComposition}
          submitLabel="Create Composition"
        />
      </div>
    </>
  )
}
