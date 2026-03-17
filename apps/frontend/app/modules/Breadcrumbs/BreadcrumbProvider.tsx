/**
 * Provider that holds the current breadcrumb trail in state.
 *
 * Mount once near the app root. Child routes call {@link useBreadcrumbs}
 * to declare their trail; the header reads it via `useBreadcrumbContext`.
 *
 * State updates are de-duplicated with a deep-equality check so that
 * re-renders from route data streaming don't cause unnecessary flicker.
 *
 * @packageDocumentation
 */
import { useState } from 'react'

import { BreadcrumbContext } from './BreadcrumbContext'
import type { BreadcrumbSegmentOrPromise } from './BreadcrumbContext'

/**
 * Deep equality check for breadcrumb segment arrays.
 *
 * Promises are compared by reference only (they are stable per `useMemo`
 * call in `useBreadcrumbs`). Resolved segments are compared by value.
 */
const areBreadcrumbsEqual = (
  a: BreadcrumbSegmentOrPromise[],
  b: BreadcrumbSegmentOrPromise[]
): boolean => {
  // Fast path: reference equality
  if (a === b) return true

  // Length check
  if (a.length !== b.length) return false

  // Deep equality check for each segment
  return a.every((segmentA, index) => {
    const segmentB = b[index]

    // Promises are compared by reference (stable per useMemo in useBreadcrumbs)
    if (segmentA instanceof Promise || segmentB instanceof Promise) {
      return segmentA === segmentB
    }

    return segmentA.label === segmentB.label && segmentA.href === segmentB.href
  })
}

export const BreadcrumbProvider = ({ children }: React.PropsWithChildren) => {
  const [breadcrumbs, setBreadcrumbsInternal] = useState<
    BreadcrumbSegmentOrPromise[]
  >([])

  const setBreadcrumbs = (newBreadcrumbs: BreadcrumbSegmentOrPromise[]) => {
    setBreadcrumbsInternal((current) => {
      // Only update if breadcrumbs actually changed (deep equality)
      if (areBreadcrumbsEqual(current, newBreadcrumbs)) {
        return current
      }
      return newBreadcrumbs
    })
  }

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}
