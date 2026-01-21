import { Context } from 'effect'
import { UserId } from '../models/UserId'

export class CurrentUserId extends Context.Tag('CurrentUserId')<
  CurrentUserId,
  { userId: UserId; authToken: string }
>() {}
