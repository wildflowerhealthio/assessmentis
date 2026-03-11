import { type Effect, type RequestResolver } from 'effect'

import type {
  AuthError,
  AuthzError,
  Loading,
  UnhandledError,
} from '@assessmentis/ontology'

import type { ReadonlyUrl } from './ReadonlyUrl'
import type * as Resource from './Resource'
import type * as ResourceRequest from './ResourceRequest'

export type ResourcesConstraint = {
  readonly [K: string]: Resource.Resource<typeof K>
}

export interface BaseOrigin<
  in Resources extends ResourcesConstraint,
  in ActiveResources extends keyof Resources,
> {
  readonly originUrl: ReadonlyUrl
  readonly activeResources: {
    readonly [K in keyof Resources]?: boolean
  } & {
    readonly [K in ActiveResources]: true
  }
  readonly provokeReauthenticate: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
  readonly provokeReauthorize: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
}

export type AnyResourceRequest<TResource extends Resource.AnyResource> =
  | ResourceRequest.Get<TResource>
  | ResourceRequest.Search<TResource>
  | ResourceRequest.Create<TResource>
  | ResourceRequest.Update<TResource>
  | ResourceRequest.Delete<TResource>

export interface ReadyOrigin<
  in Resources extends ResourcesConstraint,
  in ActiveResources extends keyof Resources,
> extends BaseOrigin<Resources, ActiveResources> {
  readonly resolver: RequestResolver.RequestResolver<
    | ResourceRequest.Get<Resources[ActiveResources]>
    | ResourceRequest.Search<Resources[ActiveResources]>
    | ResourceRequest.Create<Resources[ActiveResources]>
    | ResourceRequest.Update<Resources[ActiveResources]>
    | ResourceRequest.Delete<Resources[ActiveResources]>,
    never
  >
  readonly errorStatus: undefined
}

export interface NotReadyOrigin<
  in Resources extends ResourcesConstraint,
  in ActiveResources extends keyof Resources,
> extends BaseOrigin<Resources, ActiveResources> {
  readonly resolver: undefined
  readonly errorStatus:
    | Loading<{ originUrl: ReadonlyUrl }>
    | AuthError
    | AuthzError
    | UnhandledError
}

export type OriginState<
  Resources extends ResourcesConstraint,
  ActiveResources extends keyof Resources,
> =
  | ReadyOrigin<Resources, ActiveResources>
  | NotReadyOrigin<Resources, ActiveResources>

export const originCanResolve = <
  Resources extends ResourcesConstraint,
  ActiveResources extends keyof Resources,
  TestResource extends keyof Resources,
>(
  origin: ReadyOrigin<Resources, ActiveResources>,
  domainType: TestResource
): origin is ReadyOrigin<Resources, ActiveResources | TestResource> => {
  return Boolean(origin.activeResources[domainType])
}

export const originIsNotLoading = <
  Resources extends ResourcesConstraint,
  Active extends keyof Resources,
>(
  originState: OriginState<Resources, Active>
): originState is
  | ReadyOrigin<Resources, Active>
  | (Omit<NotReadyOrigin<Resources, Active>, 'errorStatus'> & {
      readonly errorStatus: Exclude<
        NotReadyOrigin<Resources, Active>['errorStatus'],
        Loading<{ originUrl: ReadonlyUrl }>
      >
    }) => originState.errorStatus?._tag !== 'Loading'
