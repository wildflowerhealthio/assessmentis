import type { RequestResolver } from 'effect'
import { Request } from 'effect'
import type { BaseResource, WithId } from './types'
import type {
  UnhandledError,
  AuthError,
  AuthzError,
  ExternalAssertionError,
  NotFoundError,
} from '@assessmentis/ontology'

export type Id<T extends BaseResource> = NonNullable<T['id']>

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
  [K in keyof T]?: K extends 'resourceType'
    ? never
    : string | ReadonlyArray<string>
}

export interface Search<Resource extends BaseResource> extends Request.Request<
  ReadonlyArray<WithId<Resource>>,
  CommonErrors
> {
  readonly _tag: 'Search'
  readonly resourceType: Resource['resourceType']
  readonly params: object & SearchParam<Resource>
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

export type Constructors<Resource extends BaseResource> = {
  Get: (id: Id<Resource>) => Get<Resource>
  Search: (params: SearchParam<Resource>) => Search<Resource>
  Create: (resource: Resource, requestId?: symbol) => Create<Resource>
  Update: (resource: WithId<Resource>) => Update<Resource>
  Delete: (id: Id<Resource>) => Delete<Resource>
}

export type Resolvers<Resource extends BaseResource, Dep> = {
  Get: RequestResolver.RequestResolver<Get<Resource>, Dep>
  Search: RequestResolver.RequestResolver<Search<Resource>, Dep>
  Create: RequestResolver.RequestResolver<Create<Resource>, Dep>
  Update: RequestResolver.RequestResolver<Update<Resource>, Dep>
  Delete: RequestResolver.RequestResolver<Delete<Resource>, Dep>
}

export const constructors = <Resource extends BaseResource>(
  resourceType: Resource['resourceType']
): Constructors<Resource> => ({
  Get: (id: Id<Resource>): Get<Resource> =>
    Request.of<Get<Resource>>()({
      _tag: 'Get',
      resourceType,
      id,
    }),
  Search: (params: SearchParam<Resource>): Search<Resource> =>
    Request.of<Search<Resource>>()({
      _tag: 'Search',
      resourceType,
      params,
    }),
  Create: (resource: Resource, requestId?: symbol): Create<Resource> =>
    Request.of<Create<Resource>>()({
      _tag: 'Create',
      resourceType,
      resource,
      requestId,
    }),
  Update: (resource: WithId<Resource>): Update<Resource> =>
    Request.of<Update<Resource>>()({
      _tag: 'Update',
      resourceType,
      resource,
    }),
  Delete: (id: Id<Resource>): Delete<Resource> =>
    Request.of<Delete<Resource>>()({
      _tag: 'Delete',
      resourceType,
      id,
    }),
})
