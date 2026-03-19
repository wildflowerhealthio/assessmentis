import type { HttpClient } from '@effect/platform'
import { Effect, Schema } from 'effect'
import type { Scope } from 'effect'

import type { LiveCredential } from '@assessmentis/platform-domain'

import type {
  Origin,
  OriginDefinition,
  OriginFactory,
  ReadonlyUrl,
} from '@assessmentis/effectful-store'
import { makeDailyCoReadyOriginUser } from './daily-co-origin'
import type { SupportedClasses } from './daily-co-origin'
import { DailyCoOriginDefinition } from './daily-co-origin-definition'
import type { DailyCoProxyIdentifier, DailyCoProxyToken } from './daily-co-proxy-live-credential'

/**
 * Creates an {@link OriginFactory} for DailyCo origins.
 *
 * Internalizes decoding and credential wiring. The proxy credential is
 * resolved via the injected `getCredential` callback.
 */
export const makeDailyCoOriginTypeUser = (deps: {
  httpClient: HttpClient.HttpClient
  getCredential: (
    identifier: DailyCoProxyIdentifier
  ) => Effect.Effect<LiveCredential<'dailyco_proxy', DailyCoProxyToken, never>, never, Scope.Scope>
}): OriginFactory<SupportedClasses, object> => ({
  make: <Keys extends SupportedClasses['DomainType']>(
    _originUrl: ReadonlyUrl,
    baseDef: OriginDefinition<Keys>
  ): Effect.Effect<
    Origin.AnyState<SupportedClasses & { DomainType: Keys }>,
    never,
    Scope.Scope
  > => {
    const def = Schema.decodeUnknownSync(DailyCoOriginDefinition)(baseDef)
    return deps.getCredential({ _tag: 'dailyco_proxy' }).pipe(
      Effect.map((credential) =>
        makeDailyCoReadyOriginUser({
          httpClient: deps.httpClient,
          auth: credential,
          config: def,
          provokeReauthenticate: () => Effect.void,
          provokeReauthorize: () => Effect.void,
        })
      )
    )
  },
  tag: 'daily_co',
})
