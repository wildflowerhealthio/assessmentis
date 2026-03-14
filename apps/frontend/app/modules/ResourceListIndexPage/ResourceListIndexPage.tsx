import { useState, type ComponentType } from 'react'

import type {
  RepositoryFilters,
  ResourceDataTypes,
} from '@assessmentis/clinical-domain'

import { useResourceCollection } from '../../layers/useResourceCollection'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { DomainTypedConstructor } from '../../traits/DomainTyped/DomainTyped'
import type { HubResourceConstructor } from '../../traits/HubResource'
import type { LabeledConstructor } from '../../traits/Labeled'
import {
  assertLink,
  type LinkConstructor,
  type LinkInstance,
} from '../../traits/Link/Link'
import {
  assertListable,
  type ListableConstructor,
  type ListableInstance,
} from '../../traits/Listable/Listable'
import { useBreadcrumbs } from '../Breadcrumbs/useBreadcrumbs'
import { ResourceListPage } from '../common/components/ResourceListPage/ResourceListPage'
import { ResourceListItem } from '../resources/ResourcePages/ResourceListItem/ResourceListItem'

type ResourceListIndexPageKlass<K extends keyof ResourceDataTypes & string> =
  ListableConstructor &
    LabeledConstructor &
    BreadcrumbLabelConstructor &
    LinkConstructor &
    HubResourceConstructor<K> &
    DomainTypedConstructor<K>

function ListableResourceListItem<K extends keyof ResourceDataTypes & string>(
  props: {
    item: ResourceDataTypes[K] & ListableInstance & LinkInstance
    onDelete: () => void
    loading: boolean
  } & { klass: ResourceListIndexPageKlass<K> }
) {
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

export function ResourceListIndexPage<
  K extends keyof ResourceDataTypes & string,
>(props: {
  klass: ResourceListIndexPageKlass<K>
  FilterComponent?: ComponentType<{
    onFiltersChange: (params: RepositoryFilters<ResourceDataTypes[K]>) => void
  }>
}) {
  const { klass, FilterComponent } = props
  const { singularLabel, pluralLabel } = klass.Labeled

  const [filters, setFilters] =
    useState<RepositoryFilters<ResourceDataTypes[K]>>(emptyFilters)

  const { collectionPromise, deleteItem } = useResourceCollection(
    klass,
    filters
  )

  useBreadcrumbs(() => [klass], [klass])

  function ItemComponent(itemProps: {
    item: ResourceDataTypes[K]
    onDelete: () => void
    loading: boolean
  }) {
    assertListable(itemProps.item)
    assertLink(itemProps.item)
    return (
      <ListableResourceListItem
        {...itemProps}
        item={itemProps.item}
        klass={klass}
      />
    )
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
      filterSlot={
        FilterComponent ? (
          <FilterComponent onFiltersChange={setFilters} />
        ) : undefined
      }
    />
  )
}
