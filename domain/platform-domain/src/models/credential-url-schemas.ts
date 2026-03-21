import { Schema, pipe } from 'effect'

import { ReadonlyUrl } from '@assessmentis/effectful-store'

/** Schema for user-scoped credential URLs (e.g. Google OAuth tokens). */
export const UserCredentialUrlSchema = pipe(
  ReadonlyUrl.FromString,
  Schema.brand('UserCredential/url')
)

/** Branded URL type for user-scoped credentials. */
export type UserCredentialUrl = typeof UserCredentialUrlSchema.Type

/** Schema for org-scoped (server) credential URLs (e.g. DailyCo API keys). */
export const ServerCredentialUrlSchema = pipe(
  ReadonlyUrl.FromString,
  Schema.brand('ServerCredential/url')
)

/** Branded URL type for org-scoped server credentials. */
export type ServerCredentialUrl = typeof ServerCredentialUrlSchema.Type

/** Schema for auth-derived credential URLs (e.g. DailyCo proxy tokens). */
export const AuthCredentialUrlSchema = pipe(
  ReadonlyUrl.FromString,
  Schema.brand('AuthCredential/url')
)

/** Branded URL type for auth-derived credentials. */
export type AuthCredentialUrl = typeof AuthCredentialUrlSchema.Type
