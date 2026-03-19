import { Predicate } from 'effect'
import { dual } from 'effect/Function'

/**
 * A refinement that checks whether a tagged value's `_tag` does **not**
 * match the given tag, narrowing the type via `Exclude`.
 *
 * @remarks
 * The inverse of Effect's `Predicate.isTagged`. Useful with operators that
 * accept a refinement predicate (e.g. `StreamEither.filterErrors`) to
 * exclude a specific variant from a discriminated union while preserving
 * type narrowing.
 *
 * @example
 * ```ts
 * type Err = { _tag: 'Loading' } | { _tag: 'NotFound' } | { _tag: 'Unhandled' }
 *
 * const err: Err = { _tag: 'NotFound' }
 * if (isNotTagged(err, 'Loading')) {
 *   // err is now Exclude<Err, { _tag: 'Loading' }>
 * }
 *
 * // Curried:
 * const isNotLoading = isNotTagged('Loading')
 * ```
 */
export const isNotTagged: {
  <K extends string>(tag: K): <A>(self: A) => self is Exclude<A, { readonly _tag: K }>

  <A, K extends string>(self: A, tag: K): self is Exclude<A, { readonly _tag: K }>
} = dual(
  2,
  <A extends { readonly _tag: string }, K extends string>(
    self: A,
    tag: K
  ): self is Exclude<A, { readonly _tag: K }> => !Predicate.isTagged(self, tag)
)
