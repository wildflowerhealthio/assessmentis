import { Schema } from 'effect'
import { FhirR4BackboneElement } from '../../data-types/base/BackboneElement'
import { FhirR4Resource } from '../../data-types/base/Resource'
import { FhirR4Identifier } from '../../data-types/complex/IdentifierAndReference'

const BundleId = Schema.String.pipe(Schema.brand('BundleId'))

const BundleEntryId = Schema.String.pipe(Schema.brand('BundleEntryId'))

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

const FhirR4BundleEntrySchema = <BundleContentType, BundleContentEncoded>(
  contentTypeSchema: Schema.Schema<
    BundleContentType,
    BundleContentEncoded,
    never
  >
) =>
  Schema.extend(
    FhirR4BackboneElement.Schema(BundleEntryId),
    Schema.mutable(
      Schema.Struct({
        fullUrl: Schema.optional(Schema.URL),
        link: Schema.optional(Schema.mutable(Schema.Array(Schema.Any))),
        request: Schema.optional(Schema.Any),
        resource: Schema.optional(contentTypeSchema),
        response: Schema.optional(Schema.Any),
        search: Schema.optional(Schema.Any),
      })
    )
  )

export const FhirR4Bundle = {
  Schema: <BundleContentType, BundleContentEncoded>(
    contentTypeSchema: Schema.Schema<
      BundleContentType,
      BundleContentEncoded,
      never
    >
  ) =>
    Schema.extend(
      FhirR4Resource.Schema(BundleId),
      Schema.mutable(
        Schema.Struct({
          resourceType: Schema.Literal('Bundle'),
          entry: Schema.optional(
            Schema.mutable(
              Schema.Array(FhirR4BundleEntrySchema(contentTypeSchema))
            )
          ),
          identifier: Schema.optional(
            Schema.suspend(() => FhirR4Identifier.Schema)
          ),
          link: Schema.optional(Schema.mutable(Schema.Array(Schema.Any))),
          signature: Schema.optional(Schema.Any),
          timestamp: Schema.optional(Schema.String),
          total: Schema.optional(Schema.Number),
          type: BundleType,
        })
      )
    ),
}
