import React, { Suspense } from 'react'
import { Await, Link } from 'react-router'

import { cn } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import { useBreadcrumbContext } from '../../../Breadcrumbs/breadcrumb-context'
import classes from './HeaderBreadcrumbs.module.css'

export const HeaderBreadcrumbs = (): React.JSX.Element => {
  const { breadcrumbs } = useBreadcrumbContext()
  const allBreadcrumbs =
    breadcrumbs.length > 0 ? breadcrumbs : [{ href: '/', label: 'Assessment.is' }]

  return (
    <React.Fragment key="header-breadcrumbs">
      {/* Before the crumbs will be the org picker */}
      {allBreadcrumbs.map((segment, index) => {
        const isLast = index === allBreadcrumbs.length - 1

        return (
          <React.Fragment key={index}>
            <span
              key={`slash-${index}`}
              className={cn('text-alt-heading-3', classes.HeaderBreadcrumbs__separator)}
            >
              {' / '}
            </span>
            <Suspense fallback={<Skeleton width={120} />} key={index}>
              <Await
                resolve={segment}
                errorElement={
                  <span
                    className={cn('text-alt-heading-3', classes.HeaderBreadcrumbs__current)}
                    key={`label-${index}`}
                  >
                    Error
                  </span>
                }
              >
                {(resolvedSegment) =>
                  resolvedSegment.href && !isLast ? (
                    <Link
                      key={`link-${resolvedSegment.label}`}
                      to={resolvedSegment.href}
                      className={cn('text-alt-heading-3', classes.HeaderBreadcrumbs__link)}
                    >
                      {resolvedSegment.label}
                    </Link>
                  ) : (
                    <span
                      key={`label-${resolvedSegment.label}`}
                      className={cn('text-alt-heading-3', classes.HeaderBreadcrumbs__current)}
                    >
                      {resolvedSegment.label}
                    </span>
                  )
                }
              </Await>
            </Suspense>
          </React.Fragment>
        )
      })}
    </React.Fragment>
  )
}
