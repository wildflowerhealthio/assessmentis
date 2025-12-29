import { useEncounterCollection } from '../modules/resources/Encounter/hooks/useEncounterCollection'
import type { Route } from './+types/_resource.Encounter._index'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { EncounterListItem } from '../modules/resources/Encounter/components/EncounterListItem/EncounterListItem'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

const emptyFilters = {}

export default function EncounterPage(_: Route.ComponentProps) {
  const { collection, deleteItem } = useEncounterCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Encounters' }])

  return (
    <ResourceListPage
      title="Encounters"
      collection={collection}
      createPath="/Encounter/new"
      createLabel="Create New Encounter"
      onDelete={deleteItem}
      ItemComponent={EncounterListItem}
      emptyMessage="No encounters found. Create your first encounter to get started."
    />
  )
}
