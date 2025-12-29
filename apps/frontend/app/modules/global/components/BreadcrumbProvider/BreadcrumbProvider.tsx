import { useState, useEffect } from 'react'
import {
  BreadcrumbContext,
  BreadcrumbSegment,
  useBreadcrumbContext,
} from '../../contexts/BreadcrumbContext'

// Deep equality check for breadcrumb segments
const areBreadcrumbsEqual = (
  a: BreadcrumbSegment[],
  b: BreadcrumbSegment[]
): boolean => {
  // Fast path: reference equality
  if (a === b) return true

  // Length check
  if (a.length !== b.length) return false

  // Deep equality check for each segment
  return a.every((segmentA, index) => {
    const segmentB = b[index]

    // Both segments must have same shape
    if ('loading' in segmentA && 'loading' in segmentB) {
      return segmentA.loading === segmentB.loading
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
  const [breadcrumbs, setBreadcrumbsInternal] = useState<BreadcrumbSegment[]>(
    []
  )

  const setBreadcrumbs = (newBreadcrumbs: BreadcrumbSegment[]) => {
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

// Hook for pages to set breadcrumbs (declarative API)
export const useBreadcrumbs = (breadcrumbs: BreadcrumbSegment[]) => {
  const { setBreadcrumbs } = useBreadcrumbContext()

  useEffect(() => {
    setBreadcrumbs(breadcrumbs)
  }, [breadcrumbs, setBreadcrumbs])
}
