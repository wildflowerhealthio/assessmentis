import type { HttpClient } from '@effect/platform/HttpClient'
import { Effect } from 'effect'

import { Location, Media, Observation } from '@assessmentis/clinical-domain'
import type { Origin, ResourceRequest } from '@assessmentis/effectful-store'
import { DiscriminatedRequestResolver, ReadonlyUrl } from '@assessmentis/effectful-store'
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

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- per-class resolvers are contravariant; cast widens to the multi-class union
  const resolver = DiscriminatedRequestResolver.fromRequestResolvers(
    'domainType',
    ['Location', 'Media', 'Observation'] as const,
    {
      Location: makeLocationResolver(httpClient, baseUrl, auth, config),
      Media: makeMediaResolver(httpClient, baseUrl, auth),
      Observation: makeObservationResolver(httpClient, baseUrl, auth),
    }
  ) as ResourceRequest.MultiResolver<SupportedClasses, never>

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
