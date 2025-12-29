import { useEffect } from 'react'
import {
  BreadcrumbSegment,
  useBreadcrumbContext,
} from '../../contexts/BreadcrumbContext'

// Hook for pages to set breadcrumbs (declarative API)

export const useBreadcrumbs = (breadcrumbs: BreadcrumbSegment[]) => {
  const { setBreadcrumbs } = useBreadcrumbContext()

  useEffect(() => {
    setBreadcrumbs(breadcrumbs)
  }, [breadcrumbs, setBreadcrumbs])
}
