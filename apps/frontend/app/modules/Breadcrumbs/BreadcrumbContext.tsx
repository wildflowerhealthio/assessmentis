/**
 * React context for the application breadcrumb trail.
 *
 * Routes declare their breadcrumbs via {@link useBreadcrumbs} (which calls
 * `setBreadcrumbs`), and the header reads the current trail from
 * `breadcrumbs`. Segments may be promises so that breadcrumb labels can
 * stream in alongside async route data.
 *
 * @packageDocumentation
 */
import { createContext, useContext } from 'react'

/** A single resolved breadcrumb: a label and an optional link target. */
export type BreadcrumbSegment = {
  readonly label: string
  readonly href?: string
}

/** A breadcrumb that may still be loading (promise not yet settled). */
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

/**
 * Access the breadcrumb context. Throws if called outside a
 * `BreadcrumbProvider`.
 */
export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error(
      'useBreadcrumbContext must be used within BreadcrumbProvider'
    )
  }
  return context
}
