import { useState } from 'react'
import type { ComponentType } from 'react'

import type { ClinicalDomainClasses, RepositoryFilters } from '@assessmentis/clinical-domain'

import { useResourceCollection } from '../../layers/use-resource-collection'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/breadcrumb-label'
import type { LabeledConstructor } from '../../traits/Labeled'
import { assertLink } from '../../traits/Link/link'
import type { LinkConstructor } from '../../traits/Link/link'
import { assertListable } from '../../traits/Listable/listable'
import type { ListableConstructor } from '../../traits/Listable/listable'
import { useBreadcrumbs } from '../Breadcrumbs/use-breadcrumbs'
import { ResourceListPage } from '../common/components/ResourceListPage/resource-list-page'
import { ResourceListItem } from '../resources/ResourcePages/ResourceListItem/resource-list-item'

type ResourceListIndexPageKlass = ClinicalDomainClasses &
  ListableConstructor &
  LabeledConstructor &
  BreadcrumbLabelConstructor &
  LinkConstructor

function ListableResourceListItem<K extends ResourceListIndexPageKlass>(
  props: {
    item: InstanceType<K>
    onDelete: () => void
    loading: boolean
  } & { klass: K }
): React.JSX.Element {
  const { item, onDelete, loading } = props
  const { displayName, summaryItems } = item.Listable

  return (
    <ResourceListItem
      displayName={displayName}
      summaryItems={summaryItems}
      viewPath={item.Link}
      editPath={`${item.Link}/edit`}
      onDelete={onDelete}
      loading={loading}
    />
  )
}

const emptyFilters = {}

export function ResourceListIndexPage<K extends ResourceListIndexPageKlass>(props: {
  klass: K
  FilterComponent?: ComponentType<{
    onFiltersChange: (params: RepositoryFilters<InstanceType<K>>) => void
  }>
}): React.JSX.Element {
  const { klass, FilterComponent } = props
  const { singularLabel, pluralLabel } = klass.Labeled

  const [filters, setFilters] = useState<RepositoryFilters<InstanceType<K>>>(emptyFilters)

  const { collectionPromise, deleteItem } = useResourceCollection(klass, filters)

  useBreadcrumbs(() => [klass], [klass])

  function ItemComponent(itemProps: {
    item: InstanceType<K>
    onDelete: () => void
    loading: boolean
  }): React.JSX.Element {
    assertListable(itemProps.item)
    assertLink(itemProps.item)
    return <ListableResourceListItem {...itemProps} item={itemProps.item} klass={klass} />
  }

  return (
    <ResourceListPage
      title={pluralLabel}
      collectionPromise={collectionPromise}
      createPath={`${klass.Link}/new`}
      createLabel={`Create New ${singularLabel}`}
      onDelete={(url) => deleteItem(url?.toString())}
      ItemComponent={ItemComponent}
      emptyMessage={`No ${pluralLabel.toLowerCase()} found. Create your first ${singularLabel.toLowerCase()} to get started.`}
      filterSlot={FilterComponent ? <FilterComponent onFiltersChange={setFilters} /> : undefined}
    />
  )
}
