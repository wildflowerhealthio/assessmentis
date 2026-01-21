import { Context } from 'effect'
import { OrgSlug } from '../loadedValues/IdTypes'

export class CurrentOrg extends Context.Tag('CurrentOrg')<
  CurrentOrg,
  OrgSlug
>() {}
