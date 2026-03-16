import { Effect, Match, RequestResolver } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'

import { Location, Media, Observation } from '@assessmentis/clinical-domain'
import type { Origin, ResourceRequest } from '@assessmentis/effectful-store'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'
import type { AuthError, AuthzError } from '@assessmentis/ontology'

import type { DailyCoOriginDefinition } from './DailyCoOriginDefinition'
import type { AuthReadable } from './resolverUtils'
import { makeLocationResolver } from './resources/Location/resolver'
import { makeMediaResolver } from './resources/Media/resolver'
import { makeObservationResolver } from './resources/Observation/resolver'

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** Union of all domain class constructors supported by this origin. */
export type SupportedClasses =
  | typeof Location
  | typeof Media
  | typeof Observation

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const makeDailyCoReadyOrigin = ({
  httpClient,
  auth,
  config,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  httpClient: HttpClient
  auth: AuthReadable
  config: DailyCoOriginDefinition
  provokeReauthenticate: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
  provokeReauthorize: () => Effect.Effect<
    void,
    AuthError | AuthzError | UnhandledError,
    never
  >
}): Origin.Ready<SupportedClasses> => {
  const baseUrl =
    typeof window === 'undefined'
      ? 'https://api.daily.co/v1'
      : config.dailyCoProxyUrl

  const originUrl = ReadonlyUrl.make({
    protocol: 'https:',
    host: new URL(baseUrl).host,
    pathname: new URL(baseUrl).pathname,
  })

  // Each resolver handles a single domain class, but at runtime we dispatch
  // by DomainType. The contravariant request type prevents a clean union, so
  // we widen to AnyDomainClass (same approach as FhirR4Origin).
  const resolvers = {
    [Location.DomainType]: makeLocationResolver(
      httpClient,
      baseUrl,
      auth,
      config
    ),
    [Media.DomainType]: makeMediaResolver(httpClient, baseUrl, auth),
    [Observation.DomainType]: makeObservationResolver(
      httpClient,
      baseUrl,
      auth
    ),
  } as const

  // const resolverForResource = <Klass extends SupportedClasses>(request: {
  //   klass: Klass
  // }): RequestResolver.RequestResolver<AnyRequest<Klass>, never> =>

  const resolver: ResourceRequest.MultiResolver<SupportedClasses, never> =
    RequestResolver.fromEffect(
      (request: Origin.AnyResourceRequest<SupportedClasses>) =>
        Match.value(request).pipe(
          Match.when({ klass: { DomainType: 'Location' } }, (request) =>
            Effect.request(
              request,
              resolvers['Location'] satisfies RequestResolver.RequestResolver<
                Origin.AnyResourceRequest<typeof Location>,
                never
              > as ResourceRequest.MultiResolver<SupportedClasses, never>
            )
          ),
          Match.when({ klass: { DomainType: 'Media' } }, (request) =>
            Effect.request(
              request,
              resolvers['Media'] satisfies RequestResolver.RequestResolver<
                Origin.AnyResourceRequest<typeof Media>,
                never
              > as ResourceRequest.MultiResolver<SupportedClasses, never>
            )
          ),
          Match.when({ klass: { DomainType: 'Observation' } }, (request) =>
            Effect.request(
              request,
              resolvers[
                'Observation'
              ] satisfies RequestResolver.RequestResolver<
                Origin.AnyResourceRequest<typeof Observation>,
                never
              > as ResourceRequest.MultiResolver<SupportedClasses, never>
            )
          ),
          Match.orElse((a) =>
            Effect.fail(
              new UnhandledError({
                message: `Unsupported request DomainType: ${a.klass.DomainType}`,
                cause: a,
              })
            )
          )
        )
    )

  return {
    originUrl,
    resolver,
    errorStatus: undefined,
    provokeReauthenticate,
    provokeReauthorize,
    supportedResources: {
      [Location.DomainType]: Location,
      [Media.DomainType]: Media,
      [Observation.DomainType]: Observation,
    },
  }
}
