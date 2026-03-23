import { Effect, Request as EffectRequest, Stream, pipe } from 'effect'
import type { RequestResolver } from 'effect'

import type { ReadonlyUrl } from '../readonly-url'
import type * as Resource from '../resource'
import type * as ResourceRequest from '../resource-request'
import type * as Search from '../search/index'

import { whenOriginChanges } from './change-detection'
import { resolveOriginForCreate, resolveOriginFromUrl } from './origin-resolution'
import type { AnyRequest, HubRef, Repository } from './types'

// --- Repository method builder ---

/**
 * Builds a {@link Repository} implementation that dispatches CRUD operations
 * and subscriptions through a shared `RequestResolver`. Origin resolution
 * (which origin owns a given URL or resource type) is handled automatically.
 */
export const makeRepository = <Classes extends Resource.AnyDomainClass>(
  stateRef: HubRef,
  resolver: RequestResolver.RequestResolver<AnyRequest<Classes>>
  /* oxlint-disable typescript-eslint/explicit-function-return-type -- methods are typed via Repository<Classes> interface */
): Repository<Classes> => ({
  get<Klass extends Classes>(klass: Klass, url: ReadonlyUrl) {
    return Effect.flatMap(resolveOriginFromUrl(stateRef, url, klass), (origin) =>
      Effect.request(
        EffectRequest.of<ResourceRequest.Get<Klass>>()({
          _tag: `${klass.DomainType}.Get`,
          domainType: klass.DomainType,
          operation: 'Get',
          klass,
          url,
          origin,
        }),
        resolver
      )
    )
  },
  search<Klass extends Classes>(klass: Klass, params?: Search.QueryFor<Klass>) {
    return Effect.request(
      EffectRequest.of<ResourceRequest.Search<Klass>>()({
        _tag: `${klass.DomainType}.Search`,
        domainType: klass.DomainType,
        operation: 'Search',
        klass,
        params: params ?? {},
        origin: null,
      }),
      resolver
    )
  },

  create<Klass extends Classes>(klass: Klass, resource: InstanceType<Klass>, origin?: ReadonlyUrl) {
    return Effect.flatMap(resolveOriginForCreate(stateRef, klass, origin), (resolvedOrigin) =>
      Effect.request(
        EffectRequest.of<ResourceRequest.Create<Klass>>()({
          _tag: `${klass.DomainType}.Create`,
          domainType: klass.DomainType,
          operation: 'Create',
          klass,
          resource,
          origin: resolvedOrigin,
        }),
        resolver
      )
    )
  },

  createMany<Klass extends Classes>(
    klass: Klass,
    resources: ReadonlyArray<InstanceType<Klass>>,
    origin?: ReadonlyUrl
  ) {
    return Effect.flatMap(resolveOriginForCreate(stateRef, klass, origin), (resolvedOrigin) =>
      Effect.all(
        resources.map((resource) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Create<Klass>>()({
              _tag: `${klass.DomainType}.Create`,
              operation: 'Create',
              domainType: klass.DomainType,
              klass,
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

  update<Klass extends Classes>(
    klass: Klass,
    resource: Resource.WithResourceUrl<InstanceType<Klass>>
  ) {
    return Effect.flatMap(resolveOriginFromUrl(stateRef, resource.url, klass), (origin) =>
      Effect.request(
        EffectRequest.of<ResourceRequest.Update<Klass>>()({
          _tag: `${klass.DomainType}.Update`,
          domainType: klass.DomainType,
          operation: 'Update',
          klass,
          resource,
          origin,
        }),
        resolver
      )
    )
  },

  delete<Klass extends Classes>(klass: Klass, url: ReadonlyUrl) {
    return Effect.flatMap(resolveOriginFromUrl(stateRef, url, klass), (origin) =>
      Effect.request(
        EffectRequest.of<ResourceRequest.Delete<Klass>>()({
          _tag: `${klass.DomainType}.Delete`,
          domainType: klass.DomainType,
          operation: 'Delete',
          klass,
          resource: { url },
          origin,
        }),
        resolver
      ).pipe(Effect.asVoid)
    )
  },

  // These currently only update on changes to the repository.
  // No source meaningfully supports this yet,
  subscribe<Klass extends Classes>(klass: Klass, url: ReadonlyUrl) {
    return pipe(
      whenOriginChanges(stateRef.changes, klass, url),
      Stream.mapEffect(() => Effect.either(this.get(klass, url)))
    )
  },

  subscribeSearch<Klass extends Classes>(klass: Klass, params?: Search.QueryFor<Klass>) {
    return pipe(
      whenOriginChanges(stateRef.changes, klass, null),
      Stream.mapEffect(() => Effect.either(this.search(klass, params)))
    )
  },
})
/* oxlint-enable typescript-eslint/explicit-function-return-type */
