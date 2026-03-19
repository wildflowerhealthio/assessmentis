import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Identifier } from '../../data-types/complex/identifier-and-reference'

const BundleType = Schema.Enums({
  batch: 'batch',
  'batch-response': 'batch-response',
  collection: 'collection',
  document: 'document',
  history: 'history',
  message: 'message',
  searchset: 'searchset',
  transaction: 'transaction',
  'transaction-response': 'transaction-response',
} as const)

const FhirR4BundleEntrySchema = <BundleContentType, BundleContentEncoded, R>(
  contentTypeSchema: Schema.Schema<BundleContentType, BundleContentEncoded, R>
  // oxlint-disable-next-line typescript/explicit-function-return-type
) => {
  return Schema.extend(
    BackboneElementEncodedFromFhir('BundleEntry'),
    mutableEncoded(
      Schema.Struct({
        fullUrl: Schema.optional(Schema.String),
        link: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
        request: Schema.optional(Schema.Any),
        resource: Schema.optional(contentTypeSchema),
        response: Schema.optional(Schema.Any),
        search: Schema.optional(Schema.Any),
      })
    )
  )
}
export const FhirR4Bundle = {
  // oxlint-disable-next-line typescript/explicit-function-return-type
  Schema: <BundleContentType, BundleContentEncoded, R>(
    contentTypeSchema: Schema.Schema<BundleContentType, BundleContentEncoded, R>
  ) => {
    return Schema.extend(
      ResourceEncodedFromFhirR4Resource('Bundle', 'Bundle'),
      mutableEncoded(
        Schema.Struct({
          entry: Schema.optional(
            mutableEncoded(Schema.Array(FhirR4BundleEntrySchema(contentTypeSchema)))
          ),
          identifier: Schema.optional(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)),
          link: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
          signature: Schema.optional(Schema.Any),
          timestamp: Schema.optional(Schema.String),
          total: Schema.optional(Schema.Int),
          type: BundleType,
        })
      )
    )
  },
}
