import { useLocationCollection } from '../modules/resources/Location/hooks/useLocationCollection'
import type { Route } from './+types/Location._index'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { LocationListItem } from '../modules/resources/Location/components/LocationListItem/LocationListItem'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

const emptyFilters = {}

export default function LocationPage(_: Route.ComponentProps) {
  const { collectionPromise, deleteItem } = useLocationCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Locations' }])

  return (
    <ResourceListPage
      title="Locations"
      collectionPromise={collectionPromise}
      createPath="/Location/new"
      createLabel="Create New Location"
      onDelete={deleteItem}
      ItemComponent={LocationListItem}
      emptyMessage="No locations found. Create your first location to get started."
    />
  )
}
