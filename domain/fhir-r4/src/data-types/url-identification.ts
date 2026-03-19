import { Context, Schema } from 'effect'

import type { ReadonlyUrl } from '@assessmentis/effectful-store'
import { mutableEncoded } from '@assessmentis/util'

export class BaseUrl extends Context.Tag('BaseUrl')<BaseUrl, ReadonlyUrl>() {}

// oxlint-disable-next-line @typescript-eslint/explicit-function-return-type -- return type depends on generic schema parameter
export const domainIdentification = <TDomainType extends string>(domainType: TDomainType) =>
  mutableEncoded(
    Schema.Struct({
      domainType: Schema.optional(Schema.Literal(domainType)),
      url: Schema.optional(Schema.String),
    })
  )
