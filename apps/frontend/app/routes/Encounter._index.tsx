import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { EncounterListItem } from '../modules/resources/Encounter/components/EncounterListItem/EncounterListItem'
import { useEncounterCollection } from '../modules/resources/Encounter/hooks/useEncounterCollection'
import type { Route } from './+types/Encounter._index'

const emptyFilters = {}

export default function EncounterPage(_: Route.ComponentProps) {
  const { collectionPromise, deleteItem } = useEncounterCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Encounters' }])

  return (
    <ResourceListPage
      title="Encounters"
      collectionPromise={collectionPromise}
      createPath="/Encounter/new"
      createLabel="Create New Encounter"
      onDelete={(url) => deleteItem(url?.toString())}
      ItemComponent={EncounterListItem}
      emptyMessage="No encounters found. Create your first encounter to get started."
    />
  )
}
