import { Request } from 'effect'

/**
 * Base type for resources that can be used in requests
 */
export type ResourceWithId = {
  resourceType: string
  id?: string | undefined
}

/**
 * Generic request to get a single resource by ID
 * @template TSuccess - The success type (typically WithId<T>)
 * @template TError - The error type
 * @template T - The resource type
 */
export class GetResource<
  TSuccess,
  TError,
  T extends ResourceWithId,
> extends Request.TaggedClass('GetResource')<
  TSuccess,
  TError,
  {
    readonly resourceType: T['resourceType']
    readonly id: string
  }
> {}

/**
 * Generic request to search for resources matching parameters
 * @template TSuccess - The success type (typically readonly WithId<T>[])
 * @template TError - The error type
 * @template T - The resource type
 * @template TParams - The search parameters type
 */
export class SearchResources<
  TSuccess,
  TError,
  T extends ResourceWithId,
  TParams,
> extends Request.TaggedClass('SearchResources')<
  TSuccess,
  TError,
  {
    readonly resourceType: T['resourceType']
    readonly params?: TParams
  }
> {}

/**
 * Generic request to create a new resource
 * @template TSuccess - The success type (typically WithId<T>)
 * @template TError - The error type
 * @template T - The resource type
 */
export class CreateResource<
  TSuccess,
  TError,
  T extends ResourceWithId,
> extends Request.TaggedClass('CreateResource')<
  TSuccess,
  TError,
  {
    readonly resourceType: T['resourceType']
    readonly resource: T
  }
> {}

/**
 * Generic request to update an existing resource
 * @template TSuccess - The success type (typically WithId<T>)
 * @template TError - The error type
 * @template T - The resource type with id
 */
export class UpdateResource<
  TSuccess,
  TError,
  T extends ResourceWithId & { id: string },
> extends Request.TaggedClass('UpdateResource')<
  TSuccess,
  TError,
  {
    readonly resourceType: T['resourceType']
    readonly resource: T
  }
> {}

/**
 * Generic request to delete a resource by ID
 * @template TError - The error type
 * @template T - The resource type
 */
export class DeleteResource<
  TError,
  T extends ResourceWithId,
> extends Request.TaggedClass('DeleteResource')<
  void,
  TError,
  {
    readonly resourceType: T['resourceType']
    readonly id: string
  }
> {}
