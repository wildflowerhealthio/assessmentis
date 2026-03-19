import type { Request, RequestResolver } from 'effect'

import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { ReadonlyUrl } from './readonly-url'
import type * as Resource from './resource'

/** Union of the five CRUD operation names supported by the store. */
export type RequestName = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

/**
 * Error types common to all resource requests — authentication, authorization,
 * external assertion failures, and unhandled errors.
 */
export type CommonErrors = UnhandledError | AuthError | AuthzError | ExternalAssertionError

/**
 * Request to fetch a single resource by URL from a specific origin.
 *
 * @typeParam Klass - The domain class whose instances are being fetched
 */
export interface Get<out Klass extends Resource.AnyDomainClass> extends Request.Request<
  Resource.WithResourceUrl<InstanceType<Klass>>,
  | CommonErrors
  | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
> {
  readonly _tag: 'Get'
  readonly klass: Klass
  readonly url: Resource.InferResourceUrl<InstanceType<Klass>>
  readonly origin: ReadonlyUrl
}

/**
 * Key-value filter parameters for a {@link Search} request. Each key
 * corresponds to a resource field, with values as strings or string arrays.
 *
 * @typeParam T - The resource type whose fields form the parameter keys
 */
export type SearchParam<out T extends Resource.AnyResource> = {
  readonly [K in keyof T]?: string | readonly string[]
}

/**
 * Request to search for resources matching filter parameters. When `origin`
 * is `null`, the Hub fans the search out to all origins that support the
 * resource type.
 *
 * @typeParam Klass - The domain class whose instances are being searched
 */
export interface Search<out Klass extends Resource.AnyDomainClass> extends Request.Request<
  readonly Resource.WithResourceUrl<InstanceType<Klass>>[],
  CommonErrors
> {
  readonly _tag: 'Search'
  readonly klass: Klass
  readonly params: SearchParam<InstanceType<Klass>>
  readonly origin: ReadonlyUrl | null
}

/**
 * Request to create a new resource at a specific origin.
 *
 * @typeParam Klass - The domain class whose instances are being created
 */
export interface Create<out Klass extends Resource.AnyDomainClass> extends Request.Request<
  Resource.WithResourceUrl<InstanceType<Klass>>,
  CommonErrors
> {
  readonly _tag: 'Create'
  readonly klass: Klass
  readonly requestId?: symbol
  readonly resource: InstanceType<Klass>
  readonly origin: ReadonlyUrl
}

/**
 * Request to update an existing resource at its origin. The resource must
 * already have a URL.
 *
 * @typeParam Klass - The domain class whose instances are being updated
 */
export interface Update<out Klass extends Resource.AnyDomainClass> extends Request.Request<
  Resource.WithResourceUrl<InstanceType<Klass>>,
  | CommonErrors
  | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
> {
  readonly _tag: 'Update'
  readonly klass: Klass
  readonly resource: Resource.WithResourceUrl<InstanceType<Klass>>
  readonly origin: ReadonlyUrl
}

/**
 * Request to delete a resource identified by URL at its origin.
 *
 * @typeParam Klass - The domain class whose instances are being deleted
 */
export interface Delete<out Klass extends Resource.AnyDomainClass> extends Request.Request<
  null,
  | CommonErrors
  | NotFoundError<Klass['DomainType'], { url: Resource.InferResourceUrl<InstanceType<Klass>> }>
> {
  readonly _tag: 'Delete'
  readonly klass: Klass
  readonly resource: {
    readonly url: Resource.InferResourceUrl<InstanceType<Klass>>
  }
  readonly origin: ReadonlyUrl
}

/**
 * A `RequestResolver` capable of handling all five CRUD request types for a
 * set of domain classes.
 *
 * @typeParam SupportedClasses - The domain classes this resolver handles
 * @typeParam Dep - Effect dependencies required by the resolver
 */
export interface MultiResolver<
  in SupportedClasses extends Resource.AnyDomainClass,
  out Dep,
> extends RequestResolver.RequestResolver<
  | Get<SupportedClasses>
  | Search<SupportedClasses>
  | Create<SupportedClasses>
  | Update<SupportedClasses>
  | Delete<SupportedClasses>,
  Dep
> {}
