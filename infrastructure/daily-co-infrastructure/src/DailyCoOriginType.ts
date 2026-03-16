import { Effect, Schema } from 'effect'
import type { Scope } from 'effect'
import type { HttpClient } from '@effect/platform'

import type { LiveCredential } from '@assessmentis/platform-domain'

import { makeDailyCoReadyOrigin } from './DailyCoOrigin'
import type { SupportedClasses } from './DailyCoOrigin'
import { DailyCoOriginDefinition } from './DailyCoOriginDefinition'
import type {
  DailyCoProxyIdentifier,
  DailyCoProxyToken,
} from './DailyCoProxyLiveCredential'
import type {
  OriginConfig,
  OriginFactory,
  ReadonlyUrl,
} from '@assessmentis/effectful-store'
import type {
  Location,
  Media,
  Observation,
} from '@assessmentis/clinical-domain'

/**
 * Creates an {@link OriginFactory} for DailyCo origins.
 *
 * Internalizes decoding and credential wiring. The proxy credential is
 * resolved via the injected `getCredential` callback.
 */
export const makeDailyCoOriginType = (deps: {
  httpClient: HttpClient.HttpClient
  getCredential: (
    identifier: DailyCoProxyIdentifier
  ) => Effect.Effect<
    LiveCredential<'dailyco_proxy', DailyCoProxyToken, never>,
    never,
    Scope.Scope
  >
}): OriginFactory<SupportedClasses, never> => ({
  tag: 'daily_co',
  make: <Keys extends SupportedClasses['DomainType']>(
    _originUrl: ReadonlyUrl,
    baseDef: OriginConfig<Keys>,
    _originConfig: unknown
  ) => {
    const def = Schema.decodeUnknownSync(DailyCoOriginDefinition)(baseDef)
    return deps.getCredential({ _tag: 'dailyco_proxy' }).pipe(
      Effect.map((credential) =>
        makeDailyCoReadyOrigin({
          httpClient: deps.httpClient,
          auth: credential,
          config: def,
          provokeReauthenticate: () => Effect.void,
          provokeReauthorize: () => Effect.void,
        })
      )
    )
  },
})
