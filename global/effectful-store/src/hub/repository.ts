import {
  Effect,
  Request as EffectRequest,
  pipe,
  type RequestResolver,
  Stream,
} from 'effect'

import type { ReadonlyUrl } from '../ReadonlyUrl'
import type * as Resource from '../Resource'
import type * as ResourceRequest from '../ResourceRequest'

import type { AnyRequest, HubRef, Repository } from './types'
import {
  resolveOriginForCreate,
  resolveOriginFromUrl,
} from './origin-resolution'
import { whenOriginChanges } from './change-detection'

// --- Repository method builder ---

/**
 * Builds a {@link Repository} implementation that dispatches CRUD operations
 * and subscriptions through a shared `RequestResolver`. Origin resolution
 * (which origin owns a given URL or resource type) is handled automatically.
 */
export const makeRepository = <Resources extends Resource.ResourceSet>(
  stateRef: HubRef<Resources>,
  resolver: RequestResolver.RequestResolver<AnyRequest<Resources>, never>
): Repository<Resources> => {
  return {
    get<R extends keyof Resources & string>(domainType: R, url: ReadonlyUrl) {
      return Effect.flatMap(
        resolveOriginFromUrl(stateRef, url, domainType),
        (origin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Get<Resources[R]>>()({
              _tag: 'Get',
              domainType,
              url,
              origin,
            }),
            resolver
          )
      )
    },
    search<R extends keyof Resources & string>(
      domainType: R,
      params?: ResourceRequest.SearchParam<Resources[R]>
    ) {
      return Effect.request(
        EffectRequest.of<ResourceRequest.Search<Resources[R]>>()({
          _tag: 'Search',
          domainType,
          params: params ?? {},
          origin: null,
        }),
        resolver
      )
    },

    create<R extends keyof Resources & string>(
      domainType: R,
      resource: Resources[R],
      origin?: ReadonlyUrl
    ) {
      return Effect.flatMap(
        resolveOriginForCreate(stateRef, domainType, origin),
        (resolvedOrigin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Create<Resources[R]>>()({
              _tag: 'Create',
              domainType,
              resource,
              origin: resolvedOrigin,
            }),
            resolver
          )
      )
    },

    createMany<R extends keyof Resources & string>(
      domainType: R,
      resources: ReadonlyArray<Resources[R]>,
      origin?: ReadonlyUrl
    ) {
      return Effect.flatMap(
        resolveOriginForCreate(stateRef, domainType, origin),
        (resolvedOrigin) =>
          Effect.all(
            resources.map((resource) =>
              Effect.request(
                EffectRequest.of<ResourceRequest.Create<Resources[R]>>()({
                  _tag: 'Create',
                  domainType,
                  resource,
                  origin: resolvedOrigin,
                }),
                resolver
              )
            ),
            { concurrency: 'unbounded' }
          )
      )
    },

    update<R extends keyof Resources & string>(
      domainType: R,
      resource: Resource.WithResourceUrl<Resources[R]>
    ) {
      return Effect.flatMap(
        resolveOriginFromUrl(stateRef, resource.url, domainType),
        (origin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Update<Resources[R]>>()({
              _tag: 'Update',
              domainType,
              resource,
              origin,
            }),
            resolver
          )
      )
    },

    delete<R extends keyof Resources & string>(
      domainType: R,
      url: ReadonlyUrl
    ) {
      return Effect.flatMap(
        resolveOriginFromUrl(stateRef, url, domainType),
        (origin) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Delete<Resources[R]>>()({
              _tag: 'Delete',
              domainType,
              resource: { url },
              origin,
            }),
            resolver
          ).pipe(Effect.asVoid)
      )
    },

    // These currently only update on changes to the repository.
    // No source meaningfully supports this yet,
    subscribe<R extends keyof Resources & string>(
      domainType: R,
      url: ReadonlyUrl
    ) {
      return pipe(
        whenOriginChanges(stateRef.changes, domainType, url),
        Stream.mapEffect(() => Effect.either(this.get(domainType, url)))
      )
    },

    subscribeSearch<R extends keyof Resources & string>(
      domainType: R,
      params?: ResourceRequest.SearchParam<Resources[R]>
    ) {
      return pipe(
        whenOriginChanges(stateRef.changes, domainType, null),
        Stream.mapEffect(() => Effect.either(this.search(domainType, params)))
      )
    },
  }
}
