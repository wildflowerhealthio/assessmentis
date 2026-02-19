import type { RequestResolver } from 'effect'
import type { Request } from 'effect'
import type * as Resource from './Resource'
import type {
  UnhandledError,
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'

export type RequestName = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

export type CommonErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

export interface Get<
  TResource extends Resource.AnyResource,
> extends Request.Request<
  Resource.WithResourceUrl<TResource>,
  | CommonErrors
  | NotFoundError<
      TResource[Resource.ResourceType],
      { url: Resource.InferResourceUrl<TResource> }
    >
> {
  readonly _tag: 'Get'
  readonly resourceType: TResource[Resource.ResourceType]
  readonly url: Resource.InferResourceUrl<TResource>
}

export type SearchParam<T extends Resource.AnyResource> = {
  readonly [K in keyof T]?: string | ReadonlyArray<string>
}

export interface Search<
  TResource extends Resource.AnyResource,
> extends Request.Request<
  ReadonlyArray<Resource.WithResourceUrl<TResource>>,
  CommonErrors
> {
  readonly _tag: 'Search'
  readonly resourceType: TResource[Resource.ResourceType]
  readonly params: SearchParam<TResource>
}

export interface Create<
  TResource extends Resource.AnyResource,
> extends Request.Request<Resource.WithResourceUrl<TResource>, CommonErrors> {
  readonly _tag: 'Create'
  readonly resourceType: TResource[Resource.ResourceType]
  readonly requestId?: symbol
  readonly resource: TResource
}

export interface Update<
  TResource extends Resource.AnyResource,
> extends Request.Request<
  Resource.WithResourceUrl<TResource>,
  | CommonErrors
  | NotFoundError<
      TResource[Resource.ResourceType],
      { url: Resource.InferResourceUrl<TResource> }
    >
> {
  readonly _tag: 'Update'
  readonly resourceType: TResource[Resource.ResourceType]
  readonly resource: Resource.WithResourceUrl<TResource>
}

export interface Delete<
  TResource extends Resource.AnyResource,
> extends Request.Request<
  null,
  | CommonErrors
  | NotFoundError<
      TResource[Resource.ResourceType],
      { url: Resource.InferResourceUrl<TResource> }
    >
> {
  readonly _tag: 'Delete'
  readonly resourceType: TResource[Resource.ResourceType]
  readonly url: Resource.InferResourceUrl<TResource>
}

export interface MultiResolver<
  in out TResources extends {
    readonly [K: PropertyKey]: Resource.Resource<typeof K, Resource.ReadonlyUrl>
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
