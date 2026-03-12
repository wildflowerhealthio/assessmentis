import { Context } from 'effect'

import type { UserId } from '../models/UserId'

/**
 * Effect context tag carrying the authenticated user's identity.
 *
 * @remarks
 * Provides both the {@link UserId} and the raw `authToken` string so
 * downstream services can forward credentials without a second auth lookup.
 * Set by auth middleware after token validation.
 */
export class CurrentUserId extends Context.Tag('CurrentUserId')<
  CurrentUserId,
  { userId: UserId; authToken: string }
>() {}
