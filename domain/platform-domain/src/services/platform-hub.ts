import { Context, Effect, Either, HashMap, RequestResolver, SubscriptionRef } from 'effect'

import type { Hub as HubModule } from '@assessmentis/effectful-store'
import { Hub, Origin, ReadonlyUrl, Resource } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'

import type { PlatformEntityClasses } from '../models/platform-entity-classes'

import {
  handleOrgGet,
  handleOrgUpdate,
  handleUserGet,
  handleUserOrgGet,
  handleUserOrgUpdate,
  handleUserUpdate,
} from './platform-resolver-handlers'
import { PlatformRoutes } from './platform-routes'

// ---------------------------------------------------------------------------
// Handler registry — per-type shape
// ---------------------------------------------------------------------------

/**
 * Per-type handler entry. Each DomainType maps to its supported operations.
 * Operations not present for a type are treated as unsupported.
 *
 * Handler function types use `Resource.AnyDomainClass` because the dispatch
 * table is heterogeneous — each entry handles a different concrete class.
 * Type safety is ensured at handler construction (via the generic factories),
 * not at dispatch time.
 */
interface TypeHandlers {
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  readonly get?: (request: any) => Effect.Effect<any, any, any>
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  readonly update?: (request: any) => Effect.Effect<any, any, any>
}

/**
 * A map from DomainType strings to per-type handler entries, plus the
 * `supportedResources` map needed by the Origin.
 */
interface HandlerRegistry<Classes extends Resource.AnyDomainClass> {
  readonly handlers: Readonly<Record<string, TypeHandlers | undefined>>
  readonly supportedResources: Origin.Ready<Classes>['supportedResources']
}

/**
 * Entity handler registry for Org, User, and UserOrg. These handlers live
 * in domain because they only depend on DocumentStore and PlatformRoutes.
 */
const entityTypeHandlers: Record<PlatformEntityClasses['DomainType'], TypeHandlers> = {
  Org: { get: handleOrgGet, update: handleOrgUpdate },
  User: { get: handleUserGet, update: handleUserUpdate },
  UserOrg: { get: handleUserOrgGet, update: handleUserOrgUpdate },
}

// ---------------------------------------------------------------------------
// Resolver composition
// ---------------------------------------------------------------------------

/**
 * Builds a composed `RequestResolver` from a handler registry. Dispatches
 * by `request._tag` (Get/Update/Search/Create/Delete) and then by
 * `request.klass.DomainType` to the appropriate handler.
 *
 * Search, Create, and Delete return `UnhandledError` until supported.
 */
const makePlatformResolver = <Classes extends Resource.AnyDomainClass>(
  registry: HandlerRegistry<Classes>
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
): RequestResolver.RequestResolver<Origin.AnyResourceRequest<Classes>, any> =>
  RequestResolver.fromEffect((request: Origin.AnyResourceRequest<Classes>) => {
    const typeHandlers = registry.handlers[request.klass.DomainType]

    switch (request._tag) {
      case 'Get': {
        if (typeHandlers?.get === undefined) {
          return Effect.fail(
            new UnhandledError({ message: `Get not supported for ${request.klass.DomainType}` })
          )
        }
        return typeHandlers.get(request)
      }
      case 'Update': {
        if (typeHandlers?.update === undefined) {
          return Effect.fail(
            new UnhandledError({
              message: `Update not supported for ${request.klass.DomainType}`,
            })
          )
        }
        return typeHandlers.update(request)
      }
      case 'Search': {
        return Effect.fail(
          new UnhandledError({ message: 'Search not supported for platform resources' })
        )
      }
      case 'Create': {
        return Effect.fail(
          new UnhandledError({ message: 'Create not yet supported for platform resources' })
        )
      }
      case 'Delete': {
        return Effect.fail(
          new UnhandledError({ message: 'Delete not yet supported for platform resources' })
        )
      }
    }
  })

// ---------------------------------------------------------------------------
// Static Hub creation
// ---------------------------------------------------------------------------

/**
 * Creates a static {@link Hub.Hub} for platform resources from a handler
 * registry. The Hub has a single, static origin derived from the
 * PlatformRoutes document base URL.
 *
 * @remarks
 * Unlike the clinical Hub which is dynamic (origins come and go as org
 * config changes), the platform Hub's origin is inherent and static —
 * no `hubStateStream` or `OriginFactory` needed.
 */
const makeStaticPlatformHub = <Classes extends Resource.AnyDomainClass, R>(
  registry: HandlerRegistry<Classes>,
  resolverContext: Context.Context<R>
): Effect.Effect<Hub.Hub<Classes>, never, PlatformRoutes> =>
  Effect.gen(function* () {
    const routes = yield* PlatformRoutes

    const originUrl = ReadonlyUrl.make({
      protocol: routes.documentBaseUrl.protocol,
      host: routes.documentBaseUrl.host,
      pathname: '/',
    })

    const resolver = makePlatformResolver(registry).pipe(
      RequestResolver.provideContext(resolverContext)
    )

    const origin: Origin.Ready<Classes> = {
      errorStatus: undefined,
      originUrl,
      provokeReauthenticate: () => Effect.void,
      provokeReauthorize: () => Effect.void,
      resolver,
      supportedResources: registry.supportedResources,
    }

    const hubState: HubModule.HubState = HashMap.make([
      originUrl.toString(),
      origin as Origin.AnyState<never>,
    ])
    const stateRef = yield* SubscriptionRef.make<
      Either.Either<HubModule.HubState, HubModule.HubError>
    >(Either.right(hubState))
    return Hub.makeHubFromRef<Classes>(stateRef)
  })

// ---------------------------------------------------------------------------
// Context tag
// ---------------------------------------------------------------------------

/**
 * Effect context tag for the platform Hub. Provides typed CRUD access to
 * platform entities and credentials via the Hub's request resolver.
 */
class PlatformHub extends Context.Tag('PlatformHub')<
  PlatformHub,
  Hub.Hub<Resource.AnyDomainClass>
>() {}

export {
  type HandlerRegistry,
  PlatformHub,
  type TypeHandlers,
  entityTypeHandlers,
  makeStaticPlatformHub,
}
