import { useState } from 'react'

import {
  BreadcrumbContext,
  type BreadcrumbSegmentOrPromise,
} from './BreadcrumbContext'

// Deep equality check for breadcrumb segments
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

    if ('loading' in segmentA && 'loading' in segmentB) {
      if (segmentA.loading && segmentB.loading) {
        return true
      }
      if (segmentA.loading || segmentB.loading) {
        return false
      }
    }

    if ('label' in segmentA && 'label' in segmentB) {
      return (
        segmentA.label === segmentB.label && segmentA.href === segmentB.href
      )
    }

    return false
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
