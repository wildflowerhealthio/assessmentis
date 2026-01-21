import { usePractitionerCollection } from '../modules/resources/Practitioner/hooks/usePractitionerCollection'
import type { Route } from './+types/_resource.Practitioner._index'
import { ResourceListPage } from '../modules/common/components/ResourceListPage/ResourceListPage'
import { PractitionerListItem } from '../modules/resources/Practitioner/components/PractitionerListItem/PractitionerListItem'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'

const emptyFilters = {}

export default function PractitionerPage(_: Route.ComponentProps) {
  const { collectionPromise, deleteItem } =
    usePractitionerCollection(emptyFilters)
  useBreadcrumbs([{ label: 'Practitioners' }])

  return (
    <ResourceListPage
      title="Practitioners"
      collectionPromise={collectionPromise}
      createPath="/Practitioner/new"
      createLabel="Create New Practitioner"
      onDelete={deleteItem}
      ItemComponent={PractitionerListItem}
      emptyMessage="No practitioners found. Create your first practitioner to get started."
    />
  )
}
