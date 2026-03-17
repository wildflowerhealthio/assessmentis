import { Suspense } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Await, Link } from 'react-router'

import { cn } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import 'react-loading-skeleton/dist/skeleton.css'

import type { ReadonlyUrl } from '@assessmentis/effectful-store'

import classes from './ResourceListPage.module.css'

interface ResourceListPageProps<T extends { url?: ReadonlyUrl }> {
  // Page metadata
  title: string

  // Collection data (using LoadedResult pattern)
  collectionPromise: Promise<ReadonlyArray<{ data: T; loading: boolean }>>

  // Actions
  createPath: string
  createLabel: string
  onDelete: (url: T['url']) => Promise<void>

  // List rendering - pass component instead of render function
  ItemComponent: ComponentType<{
    item: T
    onDelete: () => void
    loading: boolean
  }>

  // Empty state
  emptyMessage?: string

  // Error rendering
  ErrorBody?: React.FC<object>

  // Optional filtering
  filterSlot?: ReactNode

  // Skeleton loader
  skeletonCount?: number

  // Class overrides
  className?: string
}

const Body = <T extends { url?: ReadonlyUrl }>({
  collectionPromise,
  skeletonCount,
  emptyMessage,
  onDelete,
  ErrorBody,
  ItemComponent,
}: {
  collectionPromise: Promise<ReadonlyArray<{ data: T; loading: boolean }>>
  skeletonCount: number
  emptyMessage: string
  onDelete: (url: T['url']) => Promise<void>
  ErrorBody?: React.FC<object>
  ItemComponent: ComponentType<{
    item: T
    onDelete: () => void
    loading: boolean
  }>
}) => {
  return (
    <Suspense
      fallback={
        <ul className={classes.ListPage__list}>
          {[...Array(skeletonCount)].map((_, i) => (
            <li key={i} className={classes.ListPage__item}>
              <Skeleton width={40} height={20} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={20} />
                <Skeleton width="80%" height={16} style={{ marginTop: 4 }} />
              </div>
            </li>
          ))}
        </ul>
      }
    >
      <Await
        resolve={collectionPromise}
        errorElement={ErrorBody ? <ErrorBody /> : undefined}
      >
        {(items) =>
          items.length === 0 ? (
            <p className={cn('body-3', classes.ListPage__empty)}>
              {emptyMessage}
            </p>
          ) : (
            <ul className={classes.ListPage__list}>
              {items.map(({ data, loading }) => (
                <li
                  key={data.url?.toString() ?? ''}
                  className={classes.ListPage__item}
                  data-loading={loading}
                >
                  <ItemComponent
                    item={data}
                    onDelete={() => onDelete(data.url)}
                    loading={loading}
                  />
                </li>
              ))}
            </ul>
          )
        }
      </Await>
    </Suspense>
  )
}

export function ResourceListPage<T extends { url?: ReadonlyUrl }>(
  props: ResourceListPageProps<T>
) {
  const {
    title,
    collectionPromise,
    createPath,
    createLabel,
    onDelete,
    ItemComponent,
    emptyMessage = 'No items found.',
    ErrorBody,
    filterSlot,
    skeletonCount = 5,
    className,
  } = props

  return (
    <div className={cn(classes.ListPage, className)}>
      <div className={classes.ListPage__header}>
        <h1 className="heading-5">{title}</h1>
        <Link to={createPath} className="element-button button-2 blue filled">
          {createLabel}
        </Link>
      </div>

      {filterSlot ? (
        <div className={classes.ListPage__filters}>{filterSlot}</div>
      ) : undefined}

      <Body
        collectionPromise={collectionPromise}
        skeletonCount={skeletonCount}
        emptyMessage={emptyMessage}
        onDelete={onDelete}
        ErrorBody={ErrorBody}
        ItemComponent={ItemComponent}
      />
    </div>
  )
}
