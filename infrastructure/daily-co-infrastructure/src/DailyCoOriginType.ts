import { Effect, Schema, type Scope } from 'effect'
import type { HttpClient } from '@effect/platform'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import type { LiveCredential } from '@assessmentis/platform-domain'

import { makeDailyCoReadyOrigin } from './DailyCoOrigin'
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
}): OriginFactory<ResourceDataTypes> => ({
  tag: 'daily_co',
  make: (
    _originUrl: ReadonlyUrl,
    baseDef: OriginConfig,
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
