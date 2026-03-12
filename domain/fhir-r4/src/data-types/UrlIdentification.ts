import { Context, Schema } from 'effect'

import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import { mutableEncoded } from '@assessmentis/util'

export class BaseUrl extends Context.Tag('BaseUrl')<BaseUrl, ReadonlyUrl>() {}

export const domainIdentification = <TDomainType extends string>(
  domainType: TDomainType
) =>
  mutableEncoded(
    Schema.Struct({
      domainType: Schema.optional(Schema.Literal(domainType)),
      url: Schema.optional(Schema.String),
    })
  )
