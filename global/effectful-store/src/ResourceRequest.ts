import type { RequestResolver } from 'effect'
import type { Request } from 'effect'
import type { BaseResource, WithId, Id } from './types'
import type {
  UnhandledError,
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'
import type { DeepReadonly } from '@assessmentis/util'

export type RequestName = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

export type CommonErrors =
  | UnhandledError
  | AuthError
  | AuthzError
  | ExternalAssertionError

export interface Get<Resource extends BaseResource> extends Request.Request<
  WithId<Resource>,
  CommonErrors | NotFoundError<Resource['resourceType'], { id: Id<Resource> }>
> {
  readonly _tag: 'Get'
  readonly resourceType: Resource['resourceType']
  readonly id: Id<Resource>
}

export type SearchParam<T extends BaseResource> = {
  readonly [K in keyof T]?: string | ReadonlyArray<string>
}

export interface Search<Resource extends BaseResource> extends Request.Request<
  ReadonlyArray<WithId<Resource>>,
  CommonErrors
> {
  readonly _tag: 'Search'
  readonly resourceType: Resource['resourceType']
  readonly params: SearchParam<Resource>
}

export interface Create<Resource extends BaseResource> extends Request.Request<
  WithId<Resource>,
  CommonErrors
> {
  readonly _tag: 'Create'
  readonly resourceType: Resource['resourceType']
  readonly requestId?: symbol
  readonly resource: Resource
}

export interface Update<Resource extends BaseResource> extends Request.Request<
  WithId<Resource>,
  CommonErrors | NotFoundError<Resource['resourceType'], { id: Id<Resource> }>
> {
  readonly _tag: 'Update'
  readonly resourceType: Resource['resourceType']
  readonly resource: WithId<Resource>
}

export interface Delete<Resource extends BaseResource> extends Request.Request<
  null,
  CommonErrors | NotFoundError<Resource['resourceType'], { id: Id<Resource> }>
> {
  readonly _tag: 'Delete'
  readonly resourceType: Resource['resourceType']
  readonly id: Id<Resource>
}

export interface MultiResolver<
  in out Resources extends {
    readonly [K: string]: BaseResource & {
      readonly resourceType: typeof K
    }
  },
  in ActiveResourceTypes extends keyof Resources,
  out Dep,
> extends RequestResolver.RequestResolver<
  | Get<Resources[ActiveResourceTypes]>
  | Search<Resources[ActiveResourceTypes]>
  | Create<Resources[ActiveResourceTypes]>
  | Update<Resources[ActiveResourceTypes]>
  | Delete<Resources[ActiveResourceTypes]>,
  Dep
> {}
