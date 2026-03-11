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
 * - `null` matches all origins that support `domainType` (for fan-out search)
 * - A specific URL matches origins whose `originUrl.hasChild(url)` (for get by URL)
 *
 * Uses reference equality on Origin.AnyState objects: a new emission passes through
 * only when the set of matching origins differs in length or identity.
 */
export const whenOriginChanges = <Resources extends Resource.ResourceSet>(
  stateChanges: Stream.Stream<Either.Either<HubState<Resources>, HubError>>,
  domainType: keyof Resources & string,
  url: ReadonlyUrl | null
): Stream.Stream<HubState<Resources>> => {
  const originIsActiveForDomainType = ({
    supportedResources,
  }: Origin.AnyState<Resources, never>): boolean =>
    supportedResources[domainType]
  const originMatchesUrl = ({
    originUrl,
  }: Origin.AnyState<Resources, never>): boolean =>
    !!url && originUrl.hasChild(url)

  const isSingleUrl = url != null
  const originsUsedByQuery = (state: HubState<Resources>) =>
    pipe(
      state,
      HashMap.values,
      Iterable.filter(
        isSingleUrl ? originMatchesUrl : originIsActiveForDomainType
      ),
      Array.fromIterable
    )

  const originsForQueryAreSame = (
    prevState: HubState<Resources>,
    nextState: HubState<Resources>
  ) => {
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
