import { Match, pipe } from 'effect'
import { useEffect } from 'react'
import type { DependencyList } from 'react'

import type {
  BreadcrumbLabelConstructor,
  BreadcrumbLabelInstance,
} from '../../traits/BreadcrumbLabel/breadcrumb-label'
import type { LinkConstructor, LinkInstance } from '../../traits/Link/link'
import { useBreadcrumbContext } from './breadcrumb-context'
import type { BreadcrumbSegment, BreadcrumbSegmentOrPromise } from './breadcrumb-context'

/**
 * A class constructor whose instances and static side both carry
 * `BreadcrumbLabel` and `Link` traits — e.g. a resource model class.
 */
export type BreadcrumbableConstructor = BreadcrumbLabelConstructor & LinkConstructor

/**
 * An object instance that carries both `BreadcrumbLabel` and `Link` traits.
 */
export type BreadcrumbableInstance = BreadcrumbLabelInstance & LinkInstance

type BreadcrumbableInstanceOrPromise = BreadcrumbableInstance | Promise<BreadcrumbableInstance>

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

function isBreadcrumbableInstance(value: object): value is BreadcrumbableInstance {
  return 'BreadcrumbLabel' in value && 'Link' in value
}

/** Extract a {@link BreadcrumbSegment} from a breadcrumbable object. */
function toBreadcrumbSegment(value: BreadcrumbableInstance): BreadcrumbSegment
function toBreadcrumbSegment(value: BreadcrumbableConstructor): BreadcrumbSegment
function toBreadcrumbSegment(
  value: BreadcrumbableInstance | BreadcrumbableConstructor
): BreadcrumbSegment {
  return { href: value.Link, label: value.BreadcrumbLabel }
}

/**
 * Normalise any {@link BreadcrumbArg} into a {@link BreadcrumbSegmentOrPromise}
 * that the breadcrumb context can store directly.
 */
export function crumbToSegment(crumb: BreadcrumbArg): BreadcrumbSegmentOrPromise {
  return pipe(
    Match.value(crumb),
    Match.when(Match.string, (s): BreadcrumbSegment => ({ label: s })),
    Match.when(
      (v): v is Promise<BreadcrumbableInstance> | Promise<BreadcrumbSegment> =>
        v instanceof Promise,
      (p) =>
        p.then((resolved: BreadcrumbableInstance | BreadcrumbSegment) => {
          if (isBreadcrumbableInstance(resolved)) {
            return toBreadcrumbSegment(resolved)
          }
          return resolved
        })
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
  factory: () => readonly BreadcrumbArg[],
  deps: DependencyList
): void {
  const { setBreadcrumbs } = useBreadcrumbContext()

  useEffect(() => {
    setBreadcrumbs(factory().map((crumb) => crumbToSegment(crumb)))

    // We intentionally want to exclude `factory` from the dependency list, as
    // It's expected to be re-created on every render. Instead, we rely on the
    // Caller to include all relevant dependencies in `deps` so that the effect
    // Runs at the right times.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [setBreadcrumbs, ...deps])
}
