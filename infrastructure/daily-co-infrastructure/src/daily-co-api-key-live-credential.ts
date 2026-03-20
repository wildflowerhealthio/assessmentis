import { Duration, Effect, Schema, pipe } from 'effect'
import type { Either, Scope, SubscriptionRef } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { Search } from '@assessmentis/effectful-store'
import type { DataIntegrityError, NotFoundError, UnhandledError } from '@assessmentis/ontology'
import { DocumentStoreLiveCredential } from '@assessmentis/platform-domain'
import type {
  CredentialError,
  CredentialToken,
  DocumentPath,
  DocumentStore,
  TokenStreamError,
} from '@assessmentis/platform-domain'
import { makeCloneWith } from '@assessmentis/util'

const tag = 'dailyco_api_key' as const

const DailyCoApiKeyTokenUrlSchema = pipe(
  ReadonlyUrl.FromString,
  Schema.brand('dailyco_api_key/url')
)

/** Decoded DailyCo API key credential. */
export class DailyCoApiKeyToken
  extends Schema.TaggedClass<DailyCoApiKeyToken>('DailyCoApiKeyToken')(tag, {
    apiKey: Schema.String,
    domainType: Schema.optionalWith(Schema.Literal('dailyco_api_key'), {
      default: () => 'dailyco_api_key' as const,
    }),
    url: Schema.optional(DailyCoApiKeyTokenUrlSchema),
  })
  implements CredentialToken<DailyCoApiKeyToken, typeof tag>
{
  static readonly DomainType = 'dailyco_api_key' as const
  static readonly UrlSchema = DailyCoApiKeyTokenUrlSchema
  static readonly SearchSchema = {} as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(DailyCoApiKeyToken, this)
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
    return ['orgs', identity.orgSlug, 'credentials', 'dailyco'] satisfies DocumentPath
  }

  static readOnce(
    identity: Omit<DailyCoApiKeyIdentifier, '_tag'>
  ): Effect.Effect<
    DailyCoApiKeyToken,
    DataIntegrityError | NotFoundError<'Document', { path: readonly string[] }> | UnhandledError,
    DocumentStore
  > {
    return DocumentStoreLiveCredential._readOnce(
      DailyCoApiKeyToken,
      DailyCoApiKeyLiveCredential.pathFor({ ...identity, _tag: tag })
    )
  }

  static store(
    identity: Omit<DailyCoApiKeyIdentifier, '_tag'>,
    token: DailyCoApiKeyToken
  ): Effect.Effect<void, UnhandledError, DocumentStore> {
    return DocumentStoreLiveCredential._store(
      DailyCoApiKeyToken,
      DailyCoApiKeyLiveCredential.pathFor({ ...identity, _tag: tag }),
      token
    )
  }

  constructor(
    identity: DailyCoApiKeyIdentifier,
    stateRef: SubscriptionRef.SubscriptionRef<Either.Either<DailyCoApiKeyToken, CredentialError>>
  ) {
    super(DailyCoApiKeyLiveCredential.pathFor(identity), stateRef)
  }

  readonly refresh: Effect.Effect<void, TokenStreamError, Scope.Scope> = Effect.void
}
