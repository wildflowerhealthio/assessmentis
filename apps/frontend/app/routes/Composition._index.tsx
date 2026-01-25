import { useCompositionCollection } from '../modules/resources/Composition/hooks/useCompositionCollection'
import type { Route } from './+types/Composition._index'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { CompositionListItem } from '../modules/resources/Composition/components/CompositionListItem/CompositionListItem'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

const emptyFilters = {}

export default function CompositionPage(_: Route.ComponentProps) {
  const { collectionPromise, deleteItem } =
    useCompositionCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Compositions' }])

  return (
    <ResourceListPage
      title="Compositions"
      collectionPromise={collectionPromise}
      createPath="/Composition/new"
      createLabel="Create New Composition"
      onDelete={deleteItem}
      ItemComponent={CompositionListItem}
      emptyMessage="No compositions found. Create your first composition to get started."
    />
  )
}
