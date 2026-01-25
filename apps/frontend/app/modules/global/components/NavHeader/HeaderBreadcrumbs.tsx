import { cn } from '@assessmentis/react-util'
import { Suspense } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Await, Link } from 'react-router'
import { useBreadcrumbContext } from '../../contexts/BreadcrumbContext'

import classes from './HeaderBreadCrumbs.module.css'

export const HeaderBreadcrumbs = () => {
  const { breadcrumbs } = useBreadcrumbContext()
  const allBreadcrumbs =
    breadcrumbs.length > 0
      ? breadcrumbs
      : [{ label: 'Assessment.is', href: '/' }]

  return (
    <>
      {/* Before the crumbs will be the org picker */}
      {allBreadcrumbs.map((segment, index) => {
        const isLast = index === allBreadcrumbs.length - 1

        return (
          <>
            <span
              key={`slash-${index}`}
              className={cn(
                'text-alt-heading-3',
                classes.HeaderBreadcrumbs__separator
              )}
            >
              {' / '}
            </span>
            <Suspense fallback={<Skeleton width={120} />} key={index}>
              <Await resolve={segment}>
                {(segment) =>
                  segment.href && !isLast ? (
                    <Link
                      key={`link-${segment.label}}`}
                      to={segment.href}
                      className={cn(
                        'text-alt-heading-3',
                        classes.HeaderBreadcrumbs__link
                      )}
                    >
                      {segment.label}
                    </Link>
                  ) : (
                    <span
                      key={`label-${segment.label}}`}
                      className={cn(
                        'text-alt-heading-3',
                        classes.HeaderBreadcrumbs__current
                      )}
                    >
                      {segment.label}
                    </span>
                  )
                }
              </Await>
            </Suspense>
          </>
        )
      })}
    </>
  )
}
