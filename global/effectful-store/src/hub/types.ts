import {
  type Effect,
  type HashMap,
  type Request as EffectRequest,
  type Stream,
  Deferred,
  Duration,
  type Either,
  type SubscriptionRef,
} from 'effect'

import type {
  Loading,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import type { SideEffect } from '@assessmentis/util'
import { dual } from 'effect/Function'

import type * as Origin from '../Origin'
import type { ReadonlyUrl } from '../ReadonlyUrl'
import type * as Resource from '../Resource'
import type * as ResourceRequest from '../ResourceRequest'

// --- Pipeline types ---

/** Union of all CRUD request types across every resource in the map. */
export type AnyRequest<Resources extends Resource.ResourceSet> =
  Origin.AnyResourceRequest<Resources[keyof Resources]>

/** A request entry (request + deferred result) for any resource in the map. */
export type AnyEntry<Resources extends Resource.ResourceSet> =
  EffectRequest.Entry<AnyRequest<Resources>>

/**
 * A request entry guaranteed to have a concrete `origin` URL. Global
 * searches (with `origin: null`) have been resolved to per-origin entries
 * before reaching this type.
 */
export type OriginBoundEntry<Resources extends Resource.ResourceSet> =
  EffectRequest.Entry<
    | Exclude<AnyRequest<Resources>, { readonly _tag: 'Search' }>
    | (ResourceRequest.Search<Resources[keyof Resources]> & {
        readonly origin: ReadonlyUrl
      })
  >

/**
 * Completes a request entry's deferred with a failure. Dual-form: can be
 * called as `failEntry(entry, error)` or `failEntry(error)(entry)`.
 */
export const failEntry: {
  <Resources extends Resource.ResourceSet>(
    entry: AnyEntry<Resources>,
    error: UnhandledError | ResourceRequest.CommonErrors
  ): SideEffect.EffectAction
  (
    error: UnhandledError | ResourceRequest.CommonErrors
  ): <Resources extends Resource.ResourceSet>(
    entry: AnyEntry<Resources>
  ) => SideEffect.EffectAction
} = dual(
  2,
  <Resources extends Resource.ResourceSet>(
    entry: AnyEntry<Resources>,
    error: UnhandledError | ResourceRequest.CommonErrors
  ): SideEffect.EffectAction => Deferred.fail(entry.result, error)
)

// --- Loading timeout ---

/**
 * Maximum time to wait for a Loading origin to become ready before
 * failing the request with UnhandledError. Loading is transient — origins
 * are expected to resolve (ready or permanent error) within this window.
 */
export const LOADING_TIMEOUT = Duration.seconds(15)

// --- Hub types ---

/** The error channel of a Hub's state stream — either still loading or a common error. */
export type HubError =
  | Loading<'Hub'>
  | Loading<'Configuration'>
  | ResourceRequest.CommonErrors

/**
 * Snapshot of all known origins, keyed by origin URL string. Each value is
 * an {@link Origin.AnyState} that may or may not be ready to resolve requests.
 */
export type HubState<Resources extends Resource.ResourceSet> = HashMap.HashMap<
  string,
  Origin.AnyState<Resources, never>
>

/** Reactive ref holding the current Hub state or error, with a subscribable changes stream. */
export type HubRef<Resources extends Resource.ResourceSet> =
  SubscriptionRef.SubscriptionRef<Either.Either<HubState<Resources>, HubError>>

/**
 * Typed CRUD and subscription methods for a single resource type. These are
 * the per-resource operations exposed by {@link Repository}.
 *
 * @typeParam TResource - The resource type these methods operate on
 */
export interface ResourceMethods<TResource extends Resource.Resource<string>> {
  readonly get: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    Resource.WithResourceUrl<TResource>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        TResource['domainType'],
        { url: Resource.InferResourceUrl<TResource> }
      >,
    never
  >
  readonly subscribe: (
    url: ReadonlyUrl
  ) => Stream.Stream<
    Either.Either<
      Resource.WithResourceUrl<TResource>,
      | ResourceRequest.CommonErrors
      | NotFoundError<
          TResource['domainType'],
          { url: Resource.InferResourceUrl<TResource> }
        >
    >,
    never,
    never
  >
  readonly search: (
    params?: ResourceRequest.SearchParam<TResource>
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<TResource>>,
    ResourceRequest.CommonErrors,
    never
  >
  readonly subscribeSearch: (
    params?: ResourceRequest.SearchParam<TResource>
  ) => Stream.Stream<
    Either.Either<
      ReadonlyArray<Resource.WithResourceUrl<TResource>>,
      ResourceRequest.CommonErrors
    >,
    never,
    never
  >
  readonly create: (
    resource: TResource,
    origin?: ReadonlyUrl
  ) => Effect.Effect<
    Resource.WithResourceUrl<TResource>,
    ResourceRequest.CommonErrors,
    never
  >
  readonly createMany: (
    resources: ReadonlyArray<TResource>,
    origin?: ReadonlyUrl
  ) => Effect.Effect<
    ReadonlyArray<Resource.WithResourceUrl<TResource>>,
    ResourceRequest.CommonErrors,
    never
  >
  readonly update: (
    resource: Resource.WithResourceUrl<TResource>
  ) => Effect.Effect<
    Resource.WithResourceUrl<TResource>,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        TResource['domainType'],
        { url: Resource.InferResourceUrl<TResource> }
      >,
    never
  >
  readonly delete: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    void,
    | ResourceRequest.CommonErrors
    | NotFoundError<
        TResource['domainType'],
        { url: Resource.InferResourceUrl<TResource> }
      >,
    never
  >
}

/**
 * Maps each {@link ResourceMethods} operation into a domain-type-dispatched
 * method. The first argument is always the `domainType` string, followed by
 * the original method parameters.
 *
 * @typeParam Resources - The full resources map
 */
export type Repository<Resources extends Resource.ResourceSet> = {
  [K in keyof ResourceMethods<Resource.Resource<string>>]: <
    R extends keyof Resources & string,
  >(
    domainType: R,
    ...args: Parameters<ResourceMethods<Resources[R]>[K]>
  ) => ReturnType<ResourceMethods<Resources[R]>[K]>
}
