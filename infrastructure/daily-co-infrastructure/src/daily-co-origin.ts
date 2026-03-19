import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect, Match, RequestResolver } from 'effect'
import type { Request } from 'effect'

import { Location, Media, Observation } from '@assessmentis/clinical-domain'
import type { Origin, ResourceRequest } from '@assessmentis/effectful-store'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

import type { DailyCoOriginDefinition } from './daily-co-origin-definition'
import type { AuthReadable } from './resolver-utils'
import { makeLocationResolver } from './resources/Location/resolver'
import { makeMediaResolver } from './resources/Media/resolver'
import { makeObservationResolver } from './resources/Observation/resolver'

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** Union of all domain class constructors supported by this origin. */
export type SupportedClasses = typeof Location | typeof Media | typeof Observation

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const makeDailyCoReadyOriginUser = ({
  httpClient,
  auth,
  config,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  httpClient: HttpClient
  auth: AuthReadable
  config: DailyCoOriginDefinition
  provokeReauthenticate: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
  provokeReauthorize: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
}): Origin.Ready<SupportedClasses> =>
  makeDailyCoReadyOrigin({
    httpClient,
    auth,
    config,
    baseUrl: config.dailyCoProxyUrl,
    provokeReauthenticate,
    provokeReauthorize,
  })

export const makeDailyCoReadyOriginServer = ({
  httpClient,
  auth,
  config,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  httpClient: HttpClient
  auth: AuthReadable
  config: DailyCoOriginDefinition
  provokeReauthenticate: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
  provokeReauthorize: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
}): Origin.Ready<SupportedClasses> =>
  makeDailyCoReadyOrigin({
    httpClient,
    auth,
    config,
    baseUrl: 'https://api.daily.co/v1',
    provokeReauthenticate,
    provokeReauthorize,
  })

const makeDailyCoReadyOrigin = ({
  httpClient,
  auth,
  config,
  baseUrl,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  httpClient: HttpClient
  auth: AuthReadable
  config: DailyCoOriginDefinition
  baseUrl: string
  provokeReauthenticate: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
  provokeReauthorize: () => Effect.Effect<void, AuthError | AuthzError | UnhandledError>
}): Origin.Ready<SupportedClasses> => {
  const originUrl = ReadonlyUrl.make({
    host: new URL(baseUrl).host,
    pathname: new URL(baseUrl).pathname,
    protocol: 'https:',
  })

  // Each resolver handles a single domain class, but at runtime we dispatch
  // By DomainType. The contravariant request type prevents a clean union, so
  // We widen to AnyDomainClass (same approach as FhirR4Origin).
  const resolvers = {
    [Location.DomainType]: makeLocationResolver(httpClient, baseUrl, auth, config),
    [Media.DomainType]: makeMediaResolver(httpClient, baseUrl, auth),
    [Observation.DomainType]: makeObservationResolver(httpClient, baseUrl, auth),
  } as const

  // Each per-class resolver is contravariant in its request type, so it can't
  // Directly unify with the multi-class resolver signature. This helper widens
  // The resolver type once, keeping each Match branch concise.
  // K is inferred from the resolver only; the request stays at the union type
  // Because Match.when narrows klass but not the branded url field.
  const dispatch = <K extends SupportedClasses>(
    request: Origin.AnyResourceRequest<SupportedClasses>,
    resolver: RequestResolver.RequestResolver<Origin.AnyResourceRequest<K>>
  ): Effect.Effect<
    Request.Request.Success<Origin.AnyResourceRequest<SupportedClasses>>,
    Request.Request.Error<Origin.AnyResourceRequest<SupportedClasses>>
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  > => Effect.request(request, resolver as ResourceRequest.MultiResolver<SupportedClasses, never>)

  const resolver: ResourceRequest.MultiResolver<SupportedClasses, never> =
    RequestResolver.fromEffect((request: Origin.AnyResourceRequest<SupportedClasses>) =>
      Match.value(request).pipe(
        Match.when({ klass: { DomainType: 'Location' } }, (locationReq) =>
          dispatch(locationReq, resolvers['Location'])
        ),
        Match.when({ klass: { DomainType: 'Media' } }, (mediaReq) =>
          dispatch(mediaReq, resolvers['Media'])
        ),
        Match.when({ klass: { DomainType: 'Observation' } }, (observationReq) =>
          dispatch(observationReq, resolvers['Observation'])
        ),
        Match.orElse((a) =>
          Effect.fail(
            new UnhandledError({
              cause: a,
              message: `Unsupported request DomainType: ${a.klass.DomainType}`,
            })
          )
        )
      )
    )

  return {
    errorStatus: undefined,
    originUrl,
    provokeReauthenticate,
    provokeReauthorize,
    resolver,
    supportedResources: {
      [Location.DomainType]: Location,
      [Media.DomainType]: Media,
      [Observation.DomainType]: Observation,
    },
  }
}
