import React, { Fragment } from 'react'
import type { JSX, ReactNode } from 'react'

import { cn } from '@assessmentis/react-util'

import classes from './DetailGrid.module.css'

interface DetailGridItem {
  label: string
  value: ReactNode
  hidden?: boolean
}

interface DetailGridProps {
  items: DetailGridItem[] | { skeleton: JSX.Element[] }
  columns?: string // CSS grid-template-columns value
  className?: string
}

export function DetailGrid({
  items,
  columns = '200px 1fr',
  className,
}: DetailGridProps) {
  return (
    <dl
      className={cn(classes.DetailGrid, className)}
      style={{ gridTemplateColumns: columns }}
    >
      {'skeleton' in items
        ? items.skeleton
        : items.map(
            (item, index) =>
              !item.hidden && (
                <Fragment key={index}>
                  <dt
                    key={`dt-${index}`}
                    className={cn('body-3', classes.DetailGrid__label)}
                  >
                    {item.label}
                  </dt>
                  <dd
                    key={`dd-${index}`}
                    className={cn('body-3', classes.DetailGrid__value)}
                  >
                    {item.value}
                  </dd>
                </Fragment>
              )
          )}
    </dl>
  )
}
