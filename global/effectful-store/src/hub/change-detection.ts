import { Array, Either, HashMap, Iterable, Stream, pipe } from 'effect'

import type * as Origin from '../origin'
import type { ReadonlyUrl } from '../readonly-url'
import type * as Resource from '../resource'

import type { HubError, HubState } from './types'

// --- Origin change detection ---

/**
 * Filters a Hub changes stream to only emit when relevant origins change.
 * Skips Loading and error states (subscriptions wait silently).
 *
 * - `null` matches all origins that support the given class (for fan-out search)
 * - A specific URL matches origins whose `originUrl.hasChild(url)` (for get by URL)
 *
 * Uses reference equality on Origin.AnyState objects: a new emission passes through
 * only when the set of matching origins differs in length or identity.
 */
export const whenOriginChanges = <Classes extends Resource.AnyDomainClass>(
  stateChanges: Stream.Stream<Either.Either<HubState, HubError>>,
  klass: Classes,
  url: ReadonlyUrl | null
): Stream.Stream<HubState> => {
  const originIsActiveForDomainType = ({ supportedResources }: Origin.AnyState<never>): boolean =>
    Boolean(supportedResources[klass.DomainType])
  const originMatchesUrl = ({ originUrl }: Origin.AnyState<never>): boolean =>
    url !== null && originUrl.hasChild(url)

  const isSingleUrl = url !== null
  let filterPredicate = originIsActiveForDomainType
  if (isSingleUrl) {
    filterPredicate = originMatchesUrl
  }
  const originsUsedByQuery = (state: HubState): Origin.AnyState<never>[] =>
    pipe(
      state,
      HashMap.values,
      // oxlint-disable-next-line unicorn/no-array-callback-reference -- false positive: Iterable.filter is not an array method
      Iterable.filter(filterPredicate),
      Array.fromIterable
    )

  const originsForQueryAreSame = (prevState: HubState, nextState: HubState): boolean => {
    const prevOrigins = originsUsedByQuery(prevState)
    const nextOrigins = originsUsedByQuery(nextState)
    if (prevOrigins.length !== nextOrigins.length) {
      return false
    }
    return prevOrigins.every((o) => nextOrigins.includes(o))
  }

  return pipe(
    stateChanges,
    Stream.filterMap(Either.getRight),
    Stream.changesWith(originsForQueryAreSame)
  )
}
