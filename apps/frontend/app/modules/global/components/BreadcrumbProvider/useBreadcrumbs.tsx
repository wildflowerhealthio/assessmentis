import { useEffect } from 'react'
import type { BreadcrumbSegment } from '../../contexts/BreadcrumbContext'
import { useBreadcrumbContext } from '../../contexts/BreadcrumbContext'

// Hook for pages to set breadcrumbs (declarative API)

export const useBreadcrumbs = (breadcrumbs: BreadcrumbSegment[]) => {
  const { setBreadcrumbs } = useBreadcrumbContext()

  useEffect(() => {
    setBreadcrumbs(breadcrumbs)
  }, [breadcrumbs, setBreadcrumbs])
}
