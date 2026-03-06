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

export type RequestName = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

export type CommonErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

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

export type SearchParam<out T extends Resource.AnyResource> = {
  readonly [K in keyof T]?: string | ReadonlyArray<string>
}

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

export interface Create<
  out TResource extends Resource.AnyResource,
> extends Request.Request<Resource.WithResourceUrl<TResource>, CommonErrors> {
  readonly _tag: 'Create'
  readonly domainType: TResource['domainType']
  readonly requestId?: symbol
  readonly resource: TResource
  readonly origin: ReadonlyUrl
}

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
