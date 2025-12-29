import CompositionList from '../modules/resources/Composition/components/CompositionList'
import { useCompositionCollection } from '../modules/resources/Composition/hooks/useCompositionCollection'
import type { Route } from './+types/_resource.Composition._index'
import { Link } from 'react-router'
import { LoadedResult } from '@assessmentis/ontology'

const emptyFilters = {}

export default function CompositionPage(_: Route.ComponentProps) {
  const { collection: compositions, deleteItem: deleteComposition } =
    useCompositionCollection(emptyFilters)

  return (
    <>
      <h1 className="heading-1">Compositions</h1>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <Link to="/Composition/new" className="button-2 blue">
          Create New Composition
        </Link>
      </div>
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
        onSuccess: (compositionList) => (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <CompositionList
              compositions={compositionList}
              deleteComposition={deleteComposition}
            />
          </div>
        ),
      })}
    </>
  )
}
