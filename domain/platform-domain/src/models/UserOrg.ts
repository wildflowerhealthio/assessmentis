import { Schema } from 'effect'

import { UriEncodedOriginUrl } from '@assessmentis/effectful-store'

const BaseOriginConfig = Schema.Struct({
  _tag: Schema.String,
}).annotations({ parseOptions: { onExcessProperty: 'preserve' } })

export const UserOrg = Schema.Struct({
  originConfig: Schema.optionalWith(
    Schema.Record({
      key: UriEncodedOriginUrl,
      value: BaseOriginConfig,
    }),
    { default: () => ({}) }
  ),
})
export type UserOrg = typeof UserOrg.Type
