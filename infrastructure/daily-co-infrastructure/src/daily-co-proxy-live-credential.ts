import { Schema } from 'effect'

import { AuthDataLiveCredential } from '@assessmentis/platform-domain'
import type { AuthData, CredentialToken } from '@assessmentis/platform-domain'

const tag = 'dailyco_proxy' as const

/** Credential token for authenticating with the DailyCo proxy. */
export class DailyCoProxyToken
  extends Schema.TaggedClass<DailyCoProxyToken>('DailyCoProxyToken')(tag, {
    authToken: Schema.String,
  })
  implements CredentialToken<DailyCoProxyToken, typeof tag>
{
  readonly expiresAt = undefined

  asInvalidated(): DailyCoProxyToken {
    return new DailyCoProxyToken({ authToken: '' })
  }

  asHeaders(): { Authorization: string } {
    return { Authorization: `Bearer ${this.authToken}` }
  }
}

/** Identity key for the DailyCo proxy credential. */
export interface DailyCoProxyIdentifier {
  readonly _tag: typeof tag
}

/**
 * Live credential for authenticating with the DailyCo proxy,
 * derived from the AuthDataService stream.
 */
export class DailyCoProxyLiveCredential extends AuthDataLiveCredential<
  typeof tag,
  DailyCoProxyToken
> {
  static fromAuthData(authData: AuthData): DailyCoProxyToken {
    return new DailyCoProxyToken({ authToken: authData.authToken })
  }
}
