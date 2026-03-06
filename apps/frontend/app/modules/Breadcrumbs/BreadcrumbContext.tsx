import { createContext, useContext } from 'react'

export type BreadcrumbSegment = { label: string; href?: string }
export type BreadcrumbSegmentOrPromise =
  | BreadcrumbSegment
  | Promise<BreadcrumbSegment>

type BreadcrumbContextValue = {
  breadcrumbs: BreadcrumbSegmentOrPromise[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbSegmentOrPromise[]) => void
}

export const BreadcrumbContext = createContext<
  BreadcrumbContextValue | undefined
>(undefined)

export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error(
      'useBreadcrumbContext must be used within BreadcrumbProvider'
    )
  }
  return context
}
