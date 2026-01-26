import { Context } from 'effect'

/**
 * Optional context for providing a gcloud access token.
 * When provided, this token is used instead of Application Default Credentials.
 * Useful for local development with `gcloud auth print-access-token`.
 */
export class GCloudAccessToken extends Context.Tag('GCloudAccessToken')<
  GCloudAccessToken,
  { token: string }
>() {}
