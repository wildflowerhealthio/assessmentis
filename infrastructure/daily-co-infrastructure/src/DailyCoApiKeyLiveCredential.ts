import {
  Duration,
  Effect,
  Schema,
  type Either,
  type Scope,
  type SubscriptionRef,
} from 'effect'

import {
  DocumentStoreLiveCredential,
  type CredentialError,
  type CredentialToken,
  type DocumentPath,
  type TokenStreamError,
} from '@assessmentis/platform-domain'

const tag = 'dailyco_api_key' as const

/** Decoded DailyCo API key credential. */
export class DailyCoApiKeyToken
  extends Schema.TaggedClass<DailyCoApiKeyToken>('DailyCoApiKeyToken')(tag, {
    apiKey: Schema.String,
  })
  implements CredentialToken<DailyCoApiKeyToken, typeof tag>
{
  readonly expiresAt = undefined

  asInvalidated(): DailyCoApiKeyToken {
    return new DailyCoApiKeyToken({ apiKey: '' })
  }

  asHeaders(): { Authorization: string } {
    return { Authorization: `Bearer ${this.apiKey}` }
  }
}

/** Identity key for looking up a DailyCo API key credential. */
export interface DailyCoApiKeyIdentifier {
  readonly _tag: typeof tag
  readonly orgSlug: string
}

/**
 * Live credential for DailyCo API keys, stored in DocumentStore.
 *
 * Path: `/orgs/$orgSlug/credentials/dailyco`
 * No refresh needed — API keys are static.
 */
export class DailyCoApiKeyLiveCredential extends DocumentStoreLiveCredential<
  typeof tag,
  DailyCoApiKeyToken,
  never
> {
  static readonly schema = DailyCoApiKeyToken
  static override readonly refreshBuffer: Duration.Duration = Duration.infinity

  static pathFor(identity: DailyCoApiKeyIdentifier): DocumentPath {
    return [
      'orgs',
      identity.orgSlug,
      'credentials',
      'dailyco',
    ] satisfies DocumentPath
  }

  static readOnce(identity: Omit<DailyCoApiKeyIdentifier, '_tag'>) {
    return DocumentStoreLiveCredential._readOnce(
      DailyCoApiKeyToken,
      DailyCoApiKeyLiveCredential.pathFor({ ...identity, _tag: tag })
    )
  }

  static store(
    identity: Omit<DailyCoApiKeyIdentifier, '_tag'>,
    token: DailyCoApiKeyToken
  ) {
    return DocumentStoreLiveCredential._store(
      DailyCoApiKeyToken,
      DailyCoApiKeyLiveCredential.pathFor({ ...identity, _tag: tag }),
      token
    )
  }

  constructor(
    identity: DailyCoApiKeyIdentifier,
    stateRef: SubscriptionRef.SubscriptionRef<
      Either.Either<DailyCoApiKeyToken, CredentialError>
    >
  ) {
    super(DailyCoApiKeyLiveCredential.pathFor(identity), stateRef)
  }

  readonly refresh: Effect.Effect<void, TokenStreamError, Scope.Scope> =
    Effect.void
}
