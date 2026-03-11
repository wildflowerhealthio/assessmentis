import type { Request, RequestResolver } from 'effect'

import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { ReadonlyUrl } from './ReadonlyUrl'
import type * as Resource from './Resource'

/** Union of the five CRUD operation names supported by the store. */
export type RequestName = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

/**
 * Error types common to all resource requests — authentication, authorization,
 * external assertion failures, and unhandled errors.
 */
export type CommonErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

/**
 * Request to fetch a single resource by URL from a specific origin.
 *
 * @typeParam TResource - The resource type being fetched
 */
export interface Get<
  out TResource extends Resource.AnyResource,
> extends Request.Request<
  Resource.WithResourceUrl<TResource>,
  | CommonErrors
  | NotFoundError<
      TResource['domainType'],
      { url: Resource.InferResourceUrl<TResource> }
    >
> {
  readonly _tag: 'Get'
  readonly domainType: TResource['domainType']
  readonly url: Resource.InferResourceUrl<TResource>
  readonly origin: ReadonlyUrl
}

/**
 * Key-value filter parameters for a {@link Search} request. Each key
 * corresponds to a resource field, with values as strings or string arrays.
 *
 * @typeParam T - The resource type whose fields form the parameter keys
 */
export type SearchParam<out T extends Resource.AnyResource> = {
  readonly [K in keyof T]?: string | ReadonlyArray<string>
}

/**
 * Request to search for resources matching filter parameters. When `origin`
 * is `null`, the Hub fans the search out to all origins that support the
 * resource type.
 *
 * @typeParam TResource - The resource type being searched
 */
export interface Search<
  out TResource extends Resource.AnyResource,
> extends Request.Request<
  ReadonlyArray<Resource.WithResourceUrl<TResource>>,
  CommonErrors
> {
  readonly _tag: 'Search'
  readonly domainType: TResource['domainType']
  readonly params: SearchParam<TResource>
  readonly origin: ReadonlyUrl | null
}

/**
 * Request to create a new resource at a specific origin.
 *
 * @typeParam TResource - The resource type being created
 */
export interface Create<
  out TResource extends Resource.AnyResource,
> extends Request.Request<Resource.WithResourceUrl<TResource>, CommonErrors> {
  readonly _tag: 'Create'
  readonly domainType: TResource['domainType']
  readonly requestId?: symbol
  readonly resource: TResource
  readonly origin: ReadonlyUrl
}

/**
 * Request to update an existing resource at its origin. The resource must
 * already have a URL.
 *
 * @typeParam TResource - The resource type being updated
 */
export interface Update<
  out TResource extends Resource.AnyResource,
> extends Request.Request<
  Resource.WithResourceUrl<TResource>,
  | CommonErrors
  | NotFoundError<
      TResource['domainType'],
      { url: Resource.InferResourceUrl<TResource> }
    >
> {
  readonly _tag: 'Update'
  readonly domainType: TResource['domainType']
  readonly resource: Resource.WithResourceUrl<TResource>
  readonly origin: ReadonlyUrl
}

/**
 * Request to delete a resource identified by URL at its origin.
 *
 * @typeParam TResource - The resource type being deleted
 */
export interface Delete<
  out TResource extends Resource.AnyResource,
> extends Request.Request<
  null,
  | CommonErrors
  | NotFoundError<
      TResource['domainType'],
      { url: Resource.InferResourceUrl<TResource> }
    >
> {
  readonly _tag: 'Delete'
  readonly domainType: TResource['domainType']
  readonly resource: { readonly url: Resource.InferResourceUrl<TResource> }
  readonly origin: ReadonlyUrl
}

/**
 * A `RequestResolver` capable of handling all five CRUD request types for a
 * subset of resource types in a resources map.
 *
 * @typeParam TResources - The full resources map
 * @typeParam ActiveResourceTypes - The subset of resource keys this resolver handles
 * @typeParam Dep - Effect dependencies required by the resolver
 */
export interface MultiResolver<
  in out TResources extends {
    readonly [K: string]: Resource.Resource<typeof K>
  },
  in ActiveResourceTypes extends keyof TResources,
  out Dep,
> extends RequestResolver.RequestResolver<
  | Get<TResources[ActiveResourceTypes]>
  | Search<TResources[ActiveResourceTypes]>
  | Create<TResources[ActiveResourceTypes]>
  | Update<TResources[ActiveResourceTypes]>
  | Delete<TResources[ActiveResourceTypes]>,
  Dep
> {}
