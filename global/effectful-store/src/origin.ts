import type { Effect, RequestResolver } from 'effect'

import type { AuthError, AuthzError, UnhandledError } from '@assessmentis/ontology'

import type { ReadonlyUrl } from './readonly-url'
import type * as Resource from './resource'
import type * as ResourceRequest from './resource-request'

/**
 * Shared properties of every origin regardless of operational state. Carries
 * the origin URL, a map of which resource types it supports, and callbacks
 * to trigger re-authentication / re-authorization flows.
 *
 * @typeParam SupportedClasses - Domain classes this origin declares support for
 */
interface Base<in SupportedClasses extends Resource.AnyDomainClass> {
  readonly originUrl: ReadonlyUrl
  readonly supportedResources: {
    readonly [Klass in SupportedClasses as Klass['DomainType']]: Klass
  } & Readonly<Partial<Record<string, Resource.AnyDomainClass | undefined>>>
  readonly provokeReauthenticate: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
  readonly provokeReauthorize: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
}

/**
 * Union of all five CRUD request types for a given domain class.
 *
 * @typeParam Klass - The domain class the requests operate on
 */
export type AnyResourceRequest<Klass extends Resource.AnyDomainClass> =
  | ResourceRequest.Get<Klass>
  | ResourceRequest.Search<Klass>
  | ResourceRequest.Create<Klass>
  | ResourceRequest.Update<Klass>
  | ResourceRequest.Delete<Klass>

// --- Origin variants ---

/**
 * An origin that has a resolver and is ready to handle requests.
 * Discriminate from other variants via `resolver !== undefined`.
 *
 * @typeParam Classes - The full union of domain classes
 * @typeParam SupportedClasses - Domain classes this origin can resolve
 */
export interface Ready<
  in SupportedClasses extends Resource.AnyDomainClass,
> extends Base<SupportedClasses> {
  readonly resolver: RequestResolver.RequestResolver<AnyResourceRequest<SupportedClasses>>
  readonly errorStatus: undefined
}

/**
 * An origin that is still initializing. Both `resolver` and `errorStatus`
 * are `undefined` — the origin has registered but hasn't connected yet.
 *
 * @typeParam SupportedClasses - Domain classes this origin declares support for
 */
export interface Loading<
  in SupportedClasses extends Resource.AnyDomainClass,
> extends Base<SupportedClasses> {
  readonly resolver: undefined
  readonly errorStatus: undefined
}

/**
 * An origin in a permanent error state — authentication failure,
 * authorization failure, or unhandled error. Cannot handle requests.
 *
 * @typeParam SupportedClasses - Domain classes this origin declares support for
 */
export interface Errored<
  in SupportedClasses extends Resource.AnyDomainClass,
> extends Base<SupportedClasses> {
  readonly resolver: undefined
  readonly errorStatus: AuthError | AuthzError | UnhandledError
}

/**
 * Discriminated union of {@link Ready}, {@link Loading}, and
 * {@link Errored}. Discriminate structurally:
 * - `resolver !== undefined` → Ready
 * - `errorStatus !== undefined` → Errored
 * - Both `undefined` → Loading
 *
 * @typeParam Classes - The full union of domain classes
 * @typeParam SupportedClasses - Domain classes this origin declares support for
 */
export type AnyState<SupportedClasses extends Resource.AnyDomainClass> =
  | Ready<SupportedClasses>
  | Loading<SupportedClasses>
  | Errored<SupportedClasses>

// --- Predicates ---

/** Type guard: origin is {@link Ready} (`resolver !== undefined`). */
export const isReady = <SupportedClasses extends Resource.AnyDomainClass>(
  origin: AnyState<SupportedClasses>
): origin is Ready<SupportedClasses> => origin.resolver !== undefined

/** Type guard: origin is {@link Loading} (both fields `undefined`). */
export const isLoading = <SupportedClasses extends Resource.AnyDomainClass>(
  origin: AnyState<SupportedClasses>
): origin is Loading<SupportedClasses> =>
  origin.resolver === undefined && origin.errorStatus === undefined

/** Type guard: origin is {@link Errored} (`errorStatus !== undefined`). */
export const isErrored = <SupportedClasses extends Resource.AnyDomainClass>(
  origin: AnyState<SupportedClasses>
): origin is Errored<SupportedClasses> => origin.errorStatus !== undefined

/**
 * Type guard that excludes {@link Loading}, leaving only
 * {@link Ready} and {@link Errored} origins.
 */
export const isNotLoading = <SupportedClasses extends Resource.AnyDomainClass>(
  origin: AnyState<SupportedClasses>
): origin is Ready<SupportedClasses> | Errored<SupportedClasses> =>
  origin.resolver !== undefined || origin.errorStatus !== undefined

// --- Match ---

/**
 * Exhaustive 3-way match on an origin's operational state.
 *
 * @example
 * ```ts
 * Origin.match(origin, {
 *   onReady: (o) => dispatch(o),
 *   onLoading: (o) => defer(o),
 *   onErrored: (o) => Effect.fail(o.errorStatus),
 * })
 * ```
 */
export const match = <SupportedClasses extends Resource.AnyDomainClass, A, B, C>(
  origin: AnyState<SupportedClasses>,
  options: {
    readonly onReady: (origin: Ready<SupportedClasses>) => A
    readonly onLoading: (origin: Loading<SupportedClasses>) => B
    readonly onErrored: (origin: Errored<SupportedClasses>) => C
  }
): A | B | C => {
  if (origin.resolver !== undefined) {
    return options.onReady(origin)
  }
  if (origin.errorStatus !== undefined) {
    return options.onErrored(origin)
  }
  return options.onLoading(origin)
}

// --- Type guards ---

/**
 * Checks whether a {@link Ready} origin declares support for a specific
 * domain class by looking up `klass.DomainType` in `supportedResources`.
 */
export const supports = <
  AlreadySupported extends Resource.AnyDomainClass,
  TestClass extends Resource.AnyDomainClass,
>(
  origin: Ready<AlreadySupported>,
  klass: TestClass
): origin is Ready<AlreadySupported | TestClass> =>
  origin.supportedResources[klass.DomainType] === klass
