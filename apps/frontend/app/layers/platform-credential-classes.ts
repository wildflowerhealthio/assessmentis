import type { DailyCoApiKeyToken, DailyCoProxyToken } from '@assessmentis/daily-co-infrastructure'
import type { GoogleUserOAuthToken } from '@assessmentis/google-account-infrastructure'
import type { PlatformEntityClasses } from '@assessmentis/platform-domain'

/**
 * Union of all platform credential class constructors that satisfy the
 * `DomainClass` interface from effectful-store.
 *
 * @remarks
 * Defined in the app layer because credential token classes live in
 * infrastructure packages, which domain packages cannot import.
 */
export type PlatformCredentialClasses =
  | typeof GoogleUserOAuthToken
  | typeof DailyCoApiKeyToken
  | typeof DailyCoProxyToken

/**
 * Union of all platform class constructors (entities + credentials)
 * that satisfy the `DomainClass` interface.
 */
export type PlatformDomainClasses = PlatformEntityClasses | PlatformCredentialClasses
