import { useCompositionCollection } from '../modules/resources/Composition/hooks/useCompositionCollection'
import type { Route } from './+types/_resource.Composition._index'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { CompositionListItem } from '../modules/resources/Composition/components/CompositionListItem/CompositionListItem'
import { useBreadcrumbs } from '../modules/global/components/BreadcrumbProvider/BreadcrumbProvider'

const emptyFilters = {}

export default function CompositionPage(_: Route.ComponentProps) {
  const { collection, deleteItem } = useCompositionCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Compositions' }])

  return (
    <ResourceListPage
      title="Compositions"
      collection={collection}
      createPath="/Composition/new"
      createLabel="Create New Composition"
      onDelete={deleteItem}
      ItemComponent={CompositionListItem}
      emptyMessage="No compositions found. Create your first composition to get started."
    />
  )
}
