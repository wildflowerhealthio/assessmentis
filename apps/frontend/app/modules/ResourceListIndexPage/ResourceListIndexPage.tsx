import { useState } from 'react'
import type { ComponentType } from 'react'

import type {
  ClinicalDomainClasses,
  RepositoryFilters,
} from '@assessmentis/clinical-domain'

import { useResourceCollection } from '../../layers/useResourceCollection'
import type { BreadcrumbLabelConstructor } from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { LabeledConstructor } from '../../traits/Labeled'
import { assertLink } from '../../traits/Link/Link'
import type { LinkConstructor } from '../../traits/Link/Link'
import { assertListable } from '../../traits/Listable/Listable'
import type { ListableConstructor } from '../../traits/Listable/Listable'
import { useBreadcrumbs } from '../Breadcrumbs/useBreadcrumbs'
import { ResourceListPage } from '../common/components/ResourceListPage/ResourceListPage'
import { ResourceListItem } from '../resources/ResourcePages/ResourceListItem/ResourceListItem'

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
  K extends ResourceListIndexPageKlass,
>(props: {
  klass: K
  FilterComponent?: ComponentType<{
    onFiltersChange: (params: RepositoryFilters<InstanceType<K>>) => void
  }>
}) {
  const { klass, FilterComponent } = props
  const { singularLabel, pluralLabel } = klass.Labeled

  const [filters, setFilters] =
    useState<RepositoryFilters<InstanceType<K>>>(emptyFilters)

  const { collectionPromise, deleteItem } = useResourceCollection(
    klass,
    filters
  )

  useBreadcrumbs(() => [klass], [klass])

  function ItemComponent(itemProps: {
    item: InstanceType<K>
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
