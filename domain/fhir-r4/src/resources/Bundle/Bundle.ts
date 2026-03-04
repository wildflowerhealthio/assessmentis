import { Schema } from 'effect'

import { mutableEncoded } from '@assessmentis/util'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Identifier } from '../../data-types/complex/IdentifierAndReference'

const BundleType = Schema.Enums({
  document: 'document',
  message: 'message',
  transaction: 'transaction',
  'transaction-response': 'transaction-response',
  batch: 'batch',
  'batch-response': 'batch-response',
  history: 'history',
  searchset: 'searchset',
  collection: 'collection',
} as const)

const FhirR4BundleEntrySchema = <BundleContentType, BundleContentEncoded, R>(
  contentTypeSchema: Schema.Schema<BundleContentType, BundleContentEncoded, R>
) =>
  Schema.extend(
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

export const FhirR4Bundle = {
  Schema: <BundleContentType, BundleContentEncoded, R>(
    contentTypeSchema: Schema.Schema<BundleContentType, BundleContentEncoded, R>
  ) =>
    Schema.extend(
      ResourceEncodedFromFhirR4Resource('Bundle', 'Bundle'),
      mutableEncoded(
        Schema.Struct({
          entry: Schema.optional(
            mutableEncoded(
              Schema.Array(FhirR4BundleEntrySchema(contentTypeSchema))
            )
          ),
          identifier: Schema.optional(
            Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)
          ),
          link: Schema.optional(mutableEncoded(Schema.Array(Schema.Any))),
          signature: Schema.optional(Schema.Any),
          timestamp: Schema.optional(Schema.String),
          total: Schema.optional(Schema.Number),
          type: BundleType,
        })
      )
    ),
}
