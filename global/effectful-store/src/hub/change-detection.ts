import { Array, Either, HashMap, Iterable, pipe, Stream } from 'effect'

import type * as Resource from '../Resource'
import type * as Origin from '../Origin'
import type { ReadonlyUrl } from '../ReadonlyUrl'

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
  const originIsActiveForDomainType = ({
    supportedResources,
  }: Origin.AnyState<never>): boolean =>
    Boolean(supportedResources[klass.DomainType])
  const originMatchesUrl = ({ originUrl }: Origin.AnyState<never>): boolean =>
    !!url && originUrl.hasChild(url)

  const isSingleUrl = url != null
  const originsUsedByQuery = (state: HubState) =>
    pipe(
      state,
      HashMap.values,
      Iterable.filter(
        isSingleUrl ? originMatchesUrl : originIsActiveForDomainType
      ),
      Array.fromIterable
    )

  const originsForQueryAreSame = (prevState: HubState, nextState: HubState) => {
    const prevOrigins = originsUsedByQuery(prevState)
    const nextOrigins = originsUsedByQuery(nextState)
    if (prevOrigins.length !== nextOrigins.length) return false
    return prevOrigins.every((o, i) => o === nextOrigins[i])
  }

  return pipe(
    stateChanges,
    Stream.filterMap(Either.getRight),
    Stream.changesWith(originsForQueryAreSame)
  )
}
