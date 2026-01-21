import { Context } from 'effect'
import { OrgSlug } from '../models/IdTypes'

export class CurrentOrg extends Context.Tag('CurrentOrg')<
  CurrentOrg,
  OrgSlug
>() {}
