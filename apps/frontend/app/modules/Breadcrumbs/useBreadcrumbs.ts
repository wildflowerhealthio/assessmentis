import { useEffect, useMemo } from 'react'

import type {
  BreadcrumbLabelConstructor,
  BreadcrumbLabelInstance,
} from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { LinkConstructor, LinkInstance } from '../../traits/Link/Link'
import {
  useBreadcrumbContext,
  type BreadcrumbSegmentOrPromise,
} from './BreadcrumbContext'

export type BreadcrumbableConstructor = BreadcrumbLabelConstructor &
  LinkConstructor
export type BreadcrumbableInstance = BreadcrumbLabelInstance & LinkInstance
type BreadcrumbableInstanceOrPromise =
  | BreadcrumbableInstance
  | Promise<BreadcrumbableInstance>

export type BreadcrumbArg =
  | BreadcrumbableConstructor
  | BreadcrumbableInstanceOrPromise
  | BreadcrumbSegmentOrPromise
  | string

function isBreadcrumbableInstance(
  value: object
): value is BreadcrumbableInstance {
  return 'BreadcrumbLabel' in value && 'Link' in value
}

function crumbToSegment(crumb: BreadcrumbArg): BreadcrumbSegmentOrPromise {
  if (typeof crumb === 'string') {
    return { label: crumb }
  }

  if (typeof crumb === 'function') {
    return { label: crumb.BreadcrumbLabel, href: crumb.Link }
  }

  if (crumb instanceof Promise) {
    return crumb.then((resolved) => {
      if (isBreadcrumbableInstance(resolved)) {
        return { label: resolved.BreadcrumbLabel, href: resolved.Link }
      }
      return resolved
    })
  }

  if (isBreadcrumbableInstance(crumb)) {
    return { label: crumb.BreadcrumbLabel, href: crumb.Link }
  }

  return crumb
}

export function useBreadcrumbs(...crumbs: ReadonlyArray<BreadcrumbArg>): void {
  const { setBreadcrumbs } = useBreadcrumbContext()

  const segments = useMemo(
    () => crumbs.map(crumbToSegment),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    crumbs
  )

  useEffect(() => {
    setBreadcrumbs(segments)
  }, [segments, setBreadcrumbs])
}
