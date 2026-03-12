import { Effect, RequestResolver } from 'effect'
import type { HttpClient } from '@effect/platform/HttpClient'

import type {
  Location,
  Media,
  Observation,
} from '@assessmentis/clinical-domain'
import {
  ReadonlyUrl,
  type Origin,
  type ResourceRequest,
} from '@assessmentis/effectful-store'
import type {
  AuthError,
  AuthzError,
  UnhandledError,
} from '@assessmentis/ontology'

import type { DailyCoOriginDefinition } from './DailyCoOriginDefinition'
import type { AnyRequest, AuthReadable } from './resolverUtils'
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
}): Origin.Ready<Resources, keyof Resources> => {
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
    Location: makeLocationResolver(httpClient, baseUrl, auth, config),
    Media: makeMediaResolver(httpClient, baseUrl, auth),
    Observation: makeObservationResolver(httpClient, baseUrl, auth),
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
    supportedResources: {
      Location: true,
      Media: true,
      Observation: true,
    },
  }
}
