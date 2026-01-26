import { createContext, useContext } from 'react'

export type BreadcrumbSegment =
  | { label: string; href?: string }
  | Promise<{ label: string; href?: string }>

type BreadcrumbContextValue = {
  breadcrumbs: BreadcrumbSegment[]
  setBreadcrumbs: (breadcrumbs: BreadcrumbSegment[]) => void
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
