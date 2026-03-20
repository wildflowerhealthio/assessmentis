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
import type * as SearchModule from './search/index'

/** Union of the five CRUD operation names supported by the store. */
type RequestName = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

/**
 * Error types common to all resource requests — authentication, authorization,
 * external assertion failures, and unhandled errors.
 */
type CommonErrors = UnhandledError | AuthError | AuthzError | ExternalAssertionError

/**
 * Request to fetch a single resource by URL from a specific origin.
 *
 * @typeParam Klass - The domain class whose instances are being fetched
 */
interface Get<out Klass extends Resource.AnyDomainClass> extends Request.Request<
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
 * Request to search for resources matching filter parameters. When `origin`
 * is `null`, the Hub fans the search out to all origins that support the
 * resource type.
 *
 * @typeParam Klass - The domain class whose instances are being searched
 */
interface Search<out Klass extends Resource.AnyDomainClass> extends Request.Request<
  readonly Resource.WithResourceUrl<InstanceType<Klass>>[],
  CommonErrors
> {
  readonly _tag: 'Search'
  readonly klass: Klass
  readonly params: SearchModule.QueryFor<Klass>
  readonly origin: ReadonlyUrl | null
}

/**
 * Request to create a new resource at a specific origin.
 *
 * @typeParam Klass - The domain class whose instances are being created
 */
interface Create<out Klass extends Resource.AnyDomainClass> extends Request.Request<
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
interface Update<out Klass extends Resource.AnyDomainClass> extends Request.Request<
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
interface Delete<out Klass extends Resource.AnyDomainClass> extends Request.Request<
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
interface MultiResolver<
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

export type { RequestName, CommonErrors, Get, Search, Create, Update, Delete, MultiResolver }
