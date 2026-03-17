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

  // Each per-class resolver is contravariant in its request type, so it can't
  // directly unify with the multi-class resolver signature. This helper widens
  // the resolver type once, keeping each Match branch concise.
  // K is inferred from the resolver only; the request stays at the union type
  // because Match.when narrows klass but not the branded url field.
  const dispatch = <K extends SupportedClasses>(
    request: Origin.AnyResourceRequest<SupportedClasses>,
    resolver: RequestResolver.RequestResolver<
      Origin.AnyResourceRequest<K>,
      never
    >
  ) =>
    Effect.request(
      request,
      resolver as ResourceRequest.MultiResolver<SupportedClasses, never>
    )

  const resolver: ResourceRequest.MultiResolver<SupportedClasses, never> =
    RequestResolver.fromEffect(
      (request: Origin.AnyResourceRequest<SupportedClasses>) =>
        Match.value(request).pipe(
          Match.when({ klass: { DomainType: 'Location' } }, (request) =>
            dispatch(request, resolvers['Location'])
          ),
          Match.when({ klass: { DomainType: 'Media' } }, (request) =>
            dispatch(request, resolvers['Media'])
          ),
          Match.when({ klass: { DomainType: 'Observation' } }, (request) =>
            dispatch(request, resolvers['Observation'])
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
