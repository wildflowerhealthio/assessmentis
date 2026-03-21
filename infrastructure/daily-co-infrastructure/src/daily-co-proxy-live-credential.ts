import { Schema } from 'effect'

import type { Search } from '@assessmentis/effectful-store'
import { AuthCredentialUrlSchema, AuthDataLiveCredential } from '@assessmentis/platform-domain'
import type { AuthData, CredentialToken } from '@assessmentis/platform-domain'
import { makeCloneWith } from '@assessmentis/util'

const tag = 'dailyco_proxy' as const

/** Credential token for authenticating with the DailyCo proxy. */
export class DailyCoProxyToken
  extends Schema.TaggedClass<DailyCoProxyToken>('DailyCoProxyToken')(tag, {
    authToken: Schema.String,
    domainType: Schema.optionalWith(Schema.Literal('dailyco_proxy'), {
      default: () => 'dailyco_proxy' as const,
    }),
    url: Schema.optional(AuthCredentialUrlSchema),
  })
  implements CredentialToken<DailyCoProxyToken, typeof tag>
{
  static readonly DomainType = 'dailyco_proxy' as const
  static readonly UrlSchema = AuthCredentialUrlSchema
  static readonly SearchSchema = {} as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(DailyCoProxyToken, this)
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
