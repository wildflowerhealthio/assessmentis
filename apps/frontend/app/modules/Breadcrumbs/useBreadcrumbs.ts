import { Match, pipe } from 'effect'
import { useEffect, useMemo, type DependencyList } from 'react'

import type {
  BreadcrumbLabelConstructor,
  BreadcrumbLabelInstance,
} from '../../traits/BreadcrumbLabel/BreadcrumbLabel'
import type { LinkConstructor, LinkInstance } from '../../traits/Link/Link'
import {
  useBreadcrumbContext,
  type BreadcrumbSegment,
  type BreadcrumbSegmentOrPromise,
} from './BreadcrumbContext'

/**
 * A class constructor whose instances and static side both carry
 * `BreadcrumbLabel` and `Link` traits — e.g. a resource model class.
 */
export type BreadcrumbableConstructor = BreadcrumbLabelConstructor &
  LinkConstructor

/**
 * An object instance that carries both `BreadcrumbLabel` and `Link` traits.
 */
export type BreadcrumbableInstance = BreadcrumbLabelInstance & LinkInstance

type BreadcrumbableInstanceOrPromise =
  | BreadcrumbableInstance
  | Promise<BreadcrumbableInstance>

/**
 * Union of all types accepted as a single breadcrumb entry.
 *
 * - `string` — plain text label, no link
 * - `BreadcrumbableConstructor` — class with static `BreadcrumbLabel` / `Link`
 * - `BreadcrumbableInstanceOrPromise` — instance (or promise of one)
 * - `BreadcrumbSegmentOrPromise` — pre-built segment
 */
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

/** Extract a {@link BreadcrumbSegment} from a breadcrumbable object. */
function toBreadcrumbSegment(value: BreadcrumbableInstance): BreadcrumbSegment
function toBreadcrumbSegment(
  value: BreadcrumbableConstructor
): BreadcrumbSegment
function toBreadcrumbSegment(
  value: BreadcrumbableInstance | BreadcrumbableConstructor
): BreadcrumbSegment {
  return { label: value.BreadcrumbLabel, href: value.Link }
}

/**
 * Normalise any {@link BreadcrumbArg} into a {@link BreadcrumbSegmentOrPromise}
 * that the breadcrumb context can store directly.
 */
export function crumbToSegment(
  crumb: BreadcrumbArg
): BreadcrumbSegmentOrPromise {
  return pipe(
    Match.value(crumb),
    Match.when(Match.string, (s): BreadcrumbSegment => ({ label: s })),
    Match.when(
      (v): v is Promise<BreadcrumbableInstance> | Promise<BreadcrumbSegment> =>
        v instanceof Promise,
      (p) =>
        p.then((resolved: BreadcrumbableInstance | BreadcrumbSegment) =>
          isBreadcrumbableInstance(resolved)
            ? toBreadcrumbSegment(resolved)
            : resolved
        )
    ),
    Match.when(
      (v): v is BreadcrumbableConstructor => typeof v === 'function',
      (v) => toBreadcrumbSegment(v)
    ),
    Match.when(isBreadcrumbableInstance, (v) => toBreadcrumbSegment(v)),
    Match.orElse((segment) => segment)
  )
}

/**
 * Declare the breadcrumb trail for the current route.
 *
 * Accepts a factory function that returns an array of {@link BreadcrumbArg}
 * values (strings, constructors, instances, promises, or pre-built segments),
 * plus a React dependency list that controls when the factory is re-evaluated.
 *
 * The hook internally maps each arg through {@link crumbToSegment}, so callers
 * don't need to wrap values themselves.
 *
 * Call with an empty-array factory to clear the breadcrumbs (e.g. the index
 * route): `useBreadcrumbs(() => [], [])`.
 *
 * @example
 * ```ts
 * useBreadcrumbs(
 *   () => [Patient, patientPromise, 'Edit'],
 *   [patientPromise]
 * )
 * ```
 */
export function useBreadcrumbs(
  factory: () => ReadonlyArray<BreadcrumbArg>,
  deps: DependencyList
): void {
  const { setBreadcrumbs } = useBreadcrumbContext()

  useEffect(() => {
    setBreadcrumbs(factory().map(crumbToSegment))

    // We intentionally want to exclude `factory` from the dependency list, as
    // it's expected to be re-created on every render. Instead, we rely on the
    // caller to include all relevant dependencies in `deps` so that the effect
    // runs at the right times.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBreadcrumbs, ...deps])
}
