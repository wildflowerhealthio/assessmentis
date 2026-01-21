import { Context } from 'effect'
import { UserId } from '../loadedValues/UserId'

export class CurrentUserId extends Context.Tag('CurrentUserId')<
  CurrentUserId,
  { userId: UserId; authToken: string }
>() {}
