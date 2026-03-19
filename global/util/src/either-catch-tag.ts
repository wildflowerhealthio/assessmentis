import { Either, Predicate } from 'effect'
import { isNotTagged } from './predicates'

/**
 * Catches a `Left` value whose `_tag` matches the given tag and applies `f`
 * to recover it into a new `Either`. Non-matching `Left` values and `Right`
 * values pass through unchanged.
 *
 * Mirrors Effect's `catchTag` naming convention for plain `Either` values.
 */
export const eitherCatchTag = <
  A,
  E extends { readonly _tag: string },
  Tag extends E['_tag'],
  A2,
  E2,
>(
  either: Either.Either<A, E>,
  tag: Tag,
  f: (e: E & { readonly _tag: Tag }) => Either.Either<A2, E2>
): Either.Either<A | A2, Exclude<E, { readonly _tag: Tag }> | E2> => {
  if (Either.isRight(either)) {
    return Either.right(either.right)
  }
  if (isNotTagged(either.left, tag)) {
    return Either.left(either.left)
  }
  if (Predicate.isTagged(either.left, tag)) {
    return f(either.left)
  }

  throw new Error(
    `Invalid state: Left value is neither tagged nor untagged with ${tag}. ` +
      `Value: ${JSON.stringify(either.left)}`
  )
}
