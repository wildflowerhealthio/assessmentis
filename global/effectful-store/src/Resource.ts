import { Request } from 'effect'
import type { BaseResource, WithId } from './types'
import type { NotFoundError } from '@assessmentis/ontology'

type Id<T extends BaseResource> = NonNullable<T['id']>

type Actions = 'Get' | 'Search' | 'Create' | 'Update' | 'Delete'

type AbstractArgs<Key extends string> = {
  [Action in Actions]: {
    _tag: `${Action}${Key}`
  }
}

export interface Args<
  Key extends string,
  Resource extends BaseResource & { resourceType: Key },
> extends AbstractArgs<Key> {
  Get: {
    readonly _tag: `Get${Key}`
    readonly resourceType: Key
    readonly id: Id<Resource>
  }
  Search: {
    readonly _tag: `Search${Key}`
    readonly resourceType: Key
    readonly params?: unknown
  }
  Create: {
    readonly _tag: `Create${Key}`
    readonly requestId: symbol
    readonly resource: Resource
  }
  Update: {
    readonly _tag: `Update${Key}`
    readonly resource: WithId<Resource>
  }
  Delete: {
    readonly _tag: `Delete${Key}`
    readonly resourceType: Key
    readonly id: Id<Resource>
  }
}

export interface Results<
  Key extends string,
  Resource extends BaseResource & { resourceType: Key },
> {
  Get: WithId<Resource>
  Search: ReadonlyArray<Resource>
  Create: Resource
  Update: Resource
  Delete: null
}

export interface Errors<
  Key extends string,
  Resource extends BaseResource & { resourceType: Key },
  BaseErrors,
> {
  Get: BaseErrors | NotFoundError<Key, { id: Id<Resource> }>
  Search: BaseErrors
  Create: BaseErrors
  Update: BaseErrors | NotFoundError<Key, { id: Id<Resource> }>
  Delete: BaseErrors | NotFoundError<Key, { id: Id<Resource> }>
}

export type Requests<
  Key extends string,
  Resource extends BaseResource & { resourceType: Key },
  BaseErrors,
> = {
  [Action in Actions]: Request.Request<
    Results<Key, Resource>[Action],
    Errors<Key, Resource, BaseErrors>[Action]
  > &
    Args<Key, Resource>[Action]
}

export type RequestConstructors<
  Key extends string,
  Resource extends BaseResource & { resourceType: Key },
  BaseErrors,
> = {
  [Action in Actions]: Request.Request.Constructor<
    Requests<Key, Resource, BaseErrors>[Action],
    '_tag'
  >
}

export const constructors = <
  Key extends string,
  Resource extends BaseResource & { resourceType: Key },
  BaseErrors,
>(
  resourceType: Key
): RequestConstructors<Key, Resource, BaseErrors> => {
  type TRequests = Requests<Key, Resource, BaseErrors>

  return {
    Get: Request.tagged<TRequests['Get']>(`Get${resourceType}`),
    Search: Request.tagged<TRequests['Search']>(`Search${resourceType}`),
    Create: Request.tagged<TRequests['Create']>(`Create${resourceType}`),
    Update: Request.tagged<TRequests['Update']>(`Update${resourceType}`),
    Delete: Request.tagged<TRequests['Delete']>(`Delete${resourceType}`),
  }
}
