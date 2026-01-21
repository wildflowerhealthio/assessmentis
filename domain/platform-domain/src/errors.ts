import { Schema } from 'effect'

/**
 * Authentication error
 */
export class AuthError extends Schema.TaggedClass<AuthError>()('AuthError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {
  static Unauthenticated() {
    return new AuthError({ message: 'User is not authenticated' })
  }
}

/**
 * Authorization error (authenticated but lacking permissions)
 */
export class AuthzError extends Schema.TaggedClass<AuthzError>()('AuthzError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}
