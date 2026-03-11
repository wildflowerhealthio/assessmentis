import { type Effect, type RequestResolver } from 'effect'

import type {
  AuthError,
  AuthzError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { ReadonlyUrl } from './ReadonlyUrl'
import type * as Resource from './Resource'
import type * as ResourceRequest from './ResourceRequest'

/**
 * Shared properties of every origin regardless of operational state. Carries
 * the origin URL, a map of which resource types it supports, and callbacks
 * to trigger re-authentication / re-authorization flows.
 *
 * @typeParam Resources - The full resources map
 * @typeParam SupportedResources - Resource keys this origin declares support for
 */
interface Base<
  in Resources extends Resource.ResourceSet,
  in SupportedResources extends keyof Resources,
> {
  readonly originUrl: ReadonlyUrl
  readonly supportedResources: {
    readonly [K in keyof Resources]?: boolean
  } & {
    readonly [K in SupportedResources]: true
  }
  readonly provokeReauthenticate: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
  readonly provokeReauthorize: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
}

/**
 * Union of all five CRUD request types for a given resource.
 *
 * @typeParam TResource - The resource type the requests operate on
 */
export type AnyResourceRequest<TResource extends Resource.AnyResource> =
  | ResourceRequest.Get<TResource>
  | ResourceRequest.Search<TResource>
  | ResourceRequest.Create<TResource>
  | ResourceRequest.Update<TResource>
  | ResourceRequest.Delete<TResource>

// --- Origin variants ---

/**
 * An origin that has a resolver and is ready to handle requests.
 * Discriminate from other variants via `resolver !== undefined`.
 *
 * @typeParam Resources - The full resources map
 * @typeParam SupportedResources - Resource keys this origin can resolve
 */
export interface Ready<
  in Resources extends Resource.ResourceSet,
  in SupportedResources extends keyof Resources,
> extends Base<Resources, SupportedResources> {
  readonly resolver: RequestResolver.RequestResolver<
    | ResourceRequest.Get<Resources[SupportedResources]>
    | ResourceRequest.Search<Resources[SupportedResources]>
    | ResourceRequest.Create<Resources[SupportedResources]>
    | ResourceRequest.Update<Resources[SupportedResources]>
    | ResourceRequest.Delete<Resources[SupportedResources]>,
    never
  >
  readonly errorStatus: undefined
}

/**
 * An origin that is still initializing. Both `resolver` and `errorStatus`
 * are `undefined` — the origin has registered but hasn't connected yet.
 *
 * @typeParam Resources - The full resources map
 * @typeParam SupportedResources - Resource keys this origin declares support for
 */
export interface Loading<
  in Resources extends Resource.ResourceSet,
  in SupportedResources extends keyof Resources,
> extends Base<Resources, SupportedResources> {
  readonly resolver: undefined
  readonly errorStatus: undefined
}

/**
 * An origin in a permanent error state — authentication failure,
 * authorization failure, or unhandled error. Cannot handle requests.
 *
 * @typeParam Resources - The full resources map
 * @typeParam SupportedResources - Resource keys this origin declares support for
 */
export interface Errored<
  in Resources extends Resource.ResourceSet,
  in SupportedResources extends keyof Resources,
> extends Base<Resources, SupportedResources> {
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
 * @typeParam Resources - The full resources map
 * @typeParam SupportedResources - Resource keys this origin declares support for
 */
export type AnyState<
  Resources extends Resource.ResourceSet,
  SupportedResources extends keyof Resources,
> =
  | Ready<Resources, SupportedResources>
  | Loading<Resources, SupportedResources>
  | Errored<Resources, SupportedResources>

// --- Predicates ---

/** Type guard: origin is {@link Ready} (`resolver !== undefined`). */
export const isReady = <
  Resources extends Resource.ResourceSet,
  Supported extends keyof Resources,
>(
  origin: AnyState<Resources, Supported>
): origin is Ready<Resources, Supported> => origin.resolver !== undefined

/** Type guard: origin is {@link Loading} (both fields `undefined`). */
export const isLoading = <
  Resources extends Resource.ResourceSet,
  Supported extends keyof Resources,
>(
  origin: AnyState<Resources, Supported>
): origin is Loading<Resources, Supported> =>
  origin.resolver === undefined && origin.errorStatus === undefined

/** Type guard: origin is {@link Errored} (`errorStatus !== undefined`). */
export const isErrored = <
  Resources extends Resource.ResourceSet,
  Supported extends keyof Resources,
>(
  origin: AnyState<Resources, Supported>
): origin is Errored<Resources, Supported> => origin.errorStatus !== undefined

/**
 * Type guard that excludes {@link Loading}, leaving only
 * {@link Ready} and {@link Errored} origins.
 */
export const isNotLoading = <
  Resources extends Resource.ResourceSet,
  Supported extends keyof Resources,
>(
  origin: AnyState<Resources, Supported>
): origin is Ready<Resources, Supported> | Errored<Resources, Supported> =>
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
export const match = <
  Resources extends Resource.ResourceSet,
  Supported extends keyof Resources,
  A,
  B,
  C,
>(
  origin: AnyState<Resources, Supported>,
  options: {
    readonly onReady: (origin: Ready<Resources, Supported>) => A
    readonly onLoading: (origin: Loading<Resources, Supported>) => B
    readonly onErrored: (origin: Errored<Resources, Supported>) => C
  }
): A | B | C => {
  if (origin.resolver !== undefined) return options.onReady(origin)
  if (origin.errorStatus !== undefined) return options.onErrored(origin)
  return options.onLoading(origin)
}

// --- Type guards ---

/**
 * Narrows a {@link Ready} origin to confirm it supports a specific
 * `domainType`, widening the `SupportedResources` type parameter.
 */
export const supports = <
  Resources extends Resource.ResourceSet,
  SupportedResources extends keyof Resources,
  TestResource extends keyof Resources,
>(
  origin: Ready<Resources, SupportedResources>,
  domainType: TestResource
): origin is Ready<Resources, SupportedResources | TestResource> => {
  return Boolean(origin.supportedResources[domainType])
}
