import type { Schema } from 'effect'
import { ResourceListPage } from '../../common/components/ResourceListPage/ResourceListPage'
import { ResourceListItem } from './ResourceListItem/ResourceListItem'
import { useBreadcrumbs } from '../../global/components/BreadcrumbProvider/useBreadcrumbs'
import type { ResourcePagesConfig } from './resourcePagesConfigType'
import type { RepositoryFilters, Schemas } from '@assessmentis/clinical-domain'
import { createResourceCollectionHook } from '../../common/utils/createResourceCollectionHook'
import { useState } from 'react'

const emptyFilters = {}

export function makeResourceListIndexPage<
  TResource extends Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>,
  TFormSchema extends Schema.Schema.AnyNoContext,
>(config: ResourcePagesConfig<TResource, TFormSchema>) {
  const useCollection = createResourceCollectionHook<TResource>({
    resourceType: config.resourceType,
  })

  const ItemComponent = function ConfiguredListItem(props: {
    item: TResource
    onDelete: () => void
    loading: boolean
  }) {
    return (
      <ResourceListItem
        displayName={config.getDisplayName(props.item)}
        summaryItems={config.getListSummaryItems(props.item)}
        viewPath={`/${config.resourceType}/${props.item.url?.toString() ?? ''}`}
        editPath={`/${config.resourceType}/${props.item.url?.toString() ?? ''}/edit`}
        onDelete={props.onDelete}
        loading={props.loading}
      />
    )
  }
  ItemComponent.displayName = `${config.resourceType}ListItem`

  const FilterComponent = config.FilterComponent

  const Component = () => {
    const [filters, setFilters] =
      useState<RepositoryFilters<TResource>>(emptyFilters)

    const { collectionPromise, deleteItem } = useCollection(filters)
    useBreadcrumbs([{ label: config.pluralLabel }])

    return (
      <ResourceListPage
        title={config.pluralLabel}
        collectionPromise={collectionPromise}
        createPath={`/${config.resourceType}/new`}
        createLabel={`Create New ${config.singularLabel}`}
        onDelete={(url) => deleteItem(url?.toString())}
        ItemComponent={ItemComponent}
        emptyMessage={`No ${config.pluralLabel.toLowerCase()} found. Create your first ${config.singularLabel.toLowerCase()} to get started.`}
        filterSlot={
          FilterComponent ? (
            <FilterComponent onFiltersChange={setFilters} />
          ) : undefined
        }
      />
    )
  }

  Component.displayName = `${config.resourceType}ListIndexPage`

  return Component
}
