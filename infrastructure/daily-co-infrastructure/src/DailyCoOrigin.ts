import { Effect, RequestResolver } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'
import type { ReadyOrigin } from '@assessmentis/effectful-store'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import type { UnhandledError } from '@assessmentis/ontology'
import type {
  Location,
  Media,
  Observation,
} from '@assessmentis/clinical-domain'
import type { DailyCoConfig } from '@assessmentis/config-domain'
import type { AnyRequest } from './resolverUtils'
import { makeLocationResolver } from './resources/Location/resolver'
import { makeMediaResolver } from './resources/Media/resolver'
import { makeObservationResolver } from './resources/Observation/resolver'

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

type Resources = {
  readonly Location: Location
  readonly Media: Media
  readonly Observation: Observation
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const makeDailyCoReadyOrigin = ({
  httpClient,
  headersEffect,
  config,
  provokeReauthenticate,
  provokeReauthorize,
}: {
  httpClient: HttpClient
  headersEffect: Effect.Effect<
    Record<string, string>,
    UnhandledError | ExternalAssertionError | AuthError
  >
  config: DailyCoConfig
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
}): ReadyOrigin<Resources, keyof Resources> => {
  const baseUrl =
    typeof window === 'undefined'
      ? 'https://api.daily.co/v1'
      : config.dailyCoProxyUrl

  const originUrl = ReadonlyUrl.make({
    protocol: 'https:',
    host: new URL(baseUrl).host,
    pathname: new URL(baseUrl).pathname,
  })

  const resolvers: {
    [K in keyof Resources]: RequestResolver.RequestResolver<
      AnyRequest<Resources[K]>,
      never
    >
  } = {
    Location: makeLocationResolver(httpClient, baseUrl, headersEffect, config),
    Media: makeMediaResolver(httpClient, baseUrl, headersEffect),
    Observation: makeObservationResolver(httpClient, baseUrl, headersEffect),
  }

  const resolverForResource = <K extends keyof Resources>(request: {
    domainType: K
  }): RequestResolver.RequestResolver<AnyRequest<Resources[K]>, never> =>
    resolvers[request.domainType]

  const resolver: ResourceRequest.MultiResolver<
    Resources,
    keyof Resources,
    never
  > = RequestResolver.fromEffect((request) =>
    Effect.request(request, resolverForResource(request))
  )

  return {
    originUrl,
    resolver,
    errorStatus: undefined,
    provokeReauthenticate,
    provokeReauthorize,
    activeResources: {
      Location: true,
      Media: true,
      Observation: true,
    },
  }
}
