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

import type {
  AnyResourceRequest,
  OriginState,
  ResourcesConstraint,
} from '../OriginState'
import type { ReadonlyUrl } from '../ReadonlyUrl'
import type * as Resource from '../Resource'
import type * as ResourceRequest from '../ResourceRequest'

// --- Pipeline types ---

export type AnyRequest<Resources extends ResourcesConstraint> =
  AnyResourceRequest<Resources[keyof Resources]>

export type AnyEntry<Resources extends ResourcesConstraint> =
  EffectRequest.Entry<AnyRequest<Resources>>

export type OriginBoundEntry<Resources extends ResourcesConstraint> =
  EffectRequest.Entry<
    | Exclude<AnyRequest<Resources>, { readonly _tag: 'Search' }>
    | (ResourceRequest.Search<Resources[keyof Resources]> & {
        readonly origin: ReadonlyUrl
      })
  >

export const failEntry: {
  <Resources extends ResourcesConstraint>(
    entry: AnyEntry<Resources>,
    error: UnhandledError | ResourceRequest.CommonErrors
  ): SideEffect.EffectAction
  (
    error: UnhandledError | ResourceRequest.CommonErrors
  ): <Resources extends ResourcesConstraint>(
    entry: AnyEntry<Resources>
  ) => SideEffect.EffectAction
} = dual(
  2,
  <Resources extends ResourcesConstraint>(
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

export type HubError = Loading<string> | ResourceRequest.CommonErrors

export type HubState<Resources extends ResourcesConstraint> = HashMap.HashMap<
  string,
  OriginState<Resources, never>
>

export type HubRef<Resources extends ResourcesConstraint> =
  SubscriptionRef.SubscriptionRef<Either.Either<HubState<Resources>, HubError>>

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

export type Repository<Resources extends ResourcesConstraint> = {
  [K in keyof ResourceMethods<Resource.Resource<string>>]: <
    R extends keyof Resources & string,
  >(
    domainType: R,
    ...args: Parameters<ResourceMethods<Resources[R]>[K]>
  ) => ReturnType<ResourceMethods<Resources[R]>[K]>
}
