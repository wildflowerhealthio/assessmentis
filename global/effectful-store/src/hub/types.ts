import { Deferred, Duration } from 'effect'
import type {
  Effect,
  Request as EffectRequest,
  Either,
  HashMap,
  Stream,
  SubscriptionRef,
} from 'effect'

import type { Loading, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import type { DeferredActionWriter } from '@assessmentis/util'
import { dual } from 'effect/Function'

import type * as Origin from '../origin'
import type { ReadonlyUrl } from '../readonly-url'
import type * as Resource from '../resource'
import type * as ResourceRequest from '../resource-request'

// --- Pipeline types ---

/** Union of all CRUD request types across every domain class in the union. */
export type AnyRequest<Classes extends Resource.AnyDomainClass> = Origin.AnyResourceRequest<Classes>

/** A request entry (request + deferred result) for any domain class in the union. */
export type AnyEntry<Classes extends Resource.AnyDomainClass> = EffectRequest.Entry<
  AnyRequest<Classes>
>

/**
 * A request entry guaranteed to have a concrete `origin` URL. Global
 * searches (with `origin: null`) have been resolved to per-origin entries
 * before reaching this type.
 */
export type OriginBoundEntry<Classes extends Resource.AnyDomainClass> = EffectRequest.Entry<
  | Exclude<AnyRequest<Classes>, { readonly _tag: 'Search' }>
  | (ResourceRequest.Search<Classes> & {
      readonly origin: ReadonlyUrl
    })
>

/**
 * Completes a request entry's deferred with a failure. Dual-form: can be
 * called as `failEntry(entry, error)` or `failEntry(error)(entry)`.
 */
export const failEntry: {
  <Classes extends Resource.AnyDomainClass>(
    entry: AnyEntry<Classes>,
    error: UnhandledError | ResourceRequest.CommonErrors
  ): DeferredActionWriter.Action
  (
    error: UnhandledError | ResourceRequest.CommonErrors
  ): <Classes extends Resource.AnyDomainClass>(entry: AnyEntry<Classes>) => DeferredActionWriter.Action
} = dual(
  2,
  <Classes extends Resource.AnyDomainClass>(
    entry: AnyEntry<Classes>,
    error: UnhandledError | ResourceRequest.CommonErrors
  ): DeferredActionWriter.Action => Deferred.fail(entry.result, error)
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
export type HubError = Loading<'Hub'> | Loading<'Configuration'> | ResourceRequest.CommonErrors

/**
 * Snapshot of all known origins, keyed by origin URL string. Each value is
 * an {@link Origin.AnyState} that may or may not be ready to resolve requests.
 */
export type HubState = HashMap.HashMap<string, Origin.AnyState<never>>

/** Reactive ref holding the current Hub state or error, with a subscribable changes stream. */
export type HubRef = SubscriptionRef.SubscriptionRef<Either.Either<HubState, HubError>>

/**
 * Typed CRUD and subscription methods for a single domain class. These are
 * the per-class operations exposed by {@link Repository}.
 *
 * @typeParam Klass - The domain class these methods operate on
 */
export interface ResourceMethods<Klass extends Resource.AnyDomainClass> {
  readonly get: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    Resource.WithResourceUrl<InstanceType<Klass>>,
    | ResourceRequest.CommonErrors
    | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
  >
  readonly subscribe: (
    url: ReadonlyUrl
  ) => Stream.Stream<
    Either.Either<
      Resource.WithResourceUrl<InstanceType<Klass>>,
      | ResourceRequest.CommonErrors
      | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
    >,
    never
  >
  readonly search: (
    params?: ResourceRequest.SearchParam<InstanceType<Klass>>
  ) => Effect.Effect<
    readonly Resource.WithResourceUrl<InstanceType<Klass>>[],
    ResourceRequest.CommonErrors
  >
  readonly subscribeSearch: (
    params?: ResourceRequest.SearchParam<InstanceType<Klass>>
  ) => Stream.Stream<
    Either.Either<
      readonly Resource.WithResourceUrl<InstanceType<Klass>>[],
      ResourceRequest.CommonErrors
    >,
    never
  >
  readonly create: (
    resource: InstanceType<Klass>,
    origin?: ReadonlyUrl
  ) => Effect.Effect<Resource.WithResourceUrl<InstanceType<Klass>>, ResourceRequest.CommonErrors>
  readonly createMany: (
    resources: readonly InstanceType<Klass>[],
    origin?: ReadonlyUrl
  ) => Effect.Effect<
    readonly Resource.WithResourceUrl<InstanceType<Klass>>[],
    ResourceRequest.CommonErrors
  >
  readonly update: (
    resource: Resource.WithResourceUrl<InstanceType<Klass>>
  ) => Effect.Effect<
    Resource.WithResourceUrl<InstanceType<Klass>>,
    | ResourceRequest.CommonErrors
    | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
  >
  readonly delete: (
    url: ReadonlyUrl
  ) => Effect.Effect<
    void,
    | ResourceRequest.CommonErrors
    | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
  >
}

/**
 * Maps each {@link ResourceMethods} operation into a class-dispatched
 * method. The first argument is always the domain class, followed by
 * the original method parameters.
 *
 * @typeParam Classes - The full union of domain classes
 */
export type Repository<Classes extends Resource.AnyDomainClass> = {
  [K in keyof ResourceMethods<Resource.AnyDomainClass>]: <Klass extends Classes>(
    klass: Klass,
    ...args: Parameters<ResourceMethods<Klass>[K]>
  ) => ReturnType<ResourceMethods<Klass>[K]>
}
