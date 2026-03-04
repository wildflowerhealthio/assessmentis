import { Context } from 'effect'

import type { UserId } from '../models/UserId'

export class CurrentUserId extends Context.Tag('CurrentUserId')<
  CurrentUserId,
  { userId: UserId; authToken: string }
>() {}
