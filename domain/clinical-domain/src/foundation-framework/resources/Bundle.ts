import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type { Resource } from '../../data-types/base/Resource'
import { ResourceFromFhirR4 } from '../../data-types/base/Resource'
import type { Identifier } from '../../data-types/complex/IdentifierAndReference'
import { IdentifierFromFhirR4 } from '../../data-types/complex/IdentifierAndReference'

const BundleId = Schema.String.pipe(Schema.brand('BundleId'))
type BundleId = typeof BundleId.Type

const BundleEntryId = Schema.String.pipe(Schema.brand('BundleEntryId'))
type BundleEntryId = typeof BundleEntryId.Type

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

interface BundleEntry<
  BundleContentType,
> extends BackboneElement<BundleEntryId> {
  fullUrl?: URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  link?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request?: any
  resource?: BundleContentType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search?: any
}

export interface Bundle<T> extends Resource<BundleId> {
  resourceType: 'Bundle'
  entry?: BundleEntry<T>[]
  identifier?: Identifier
  link?: unknown[]
  signature?: unknown
  timestamp?: string
  total?: number
  type: Schema.Schema.Type<typeof BundleType>
}

export interface OptionalIdBundle<T> extends Omit<Bundle<T>, 'id' | 'entry'> {
  id?: BundleEntryId
  entry?: BundleEntry<T>[]
}

/**
 * An entry in a bundle resource - will either contain a resource or information
 * about a resource (transactions and history only).
 */
const BundleEntry = <BundleContentType, BundleContentEncoded>(
  contentTypeSchema: Schema.Schema<
    BundleContentType,
    BundleContentEncoded,
    never
  >
): Schema.Schema<
  BundleEntry<BundleContentType>,
  fhir.BundleEntry<BundleContentEncoded>,
  never
> =>
  Schema.extend(
    BackboneElementFromFhirR4(BundleEntryId),
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

/**
 * A container for a collection of resources.
 */
export const BundleFromFhirR4 = <BundleContentType, BundleContentEncoded>(
  contentTypeSchema: Schema.Schema<
    BundleContentType,
    BundleContentEncoded,
    never
  >
): Schema.Schema<
  Bundle<BundleContentType>,
  fhir.Bundle<BundleContentEncoded>,
  never
> =>
  Schema.extend(
    ResourceFromFhirR4(BundleId),
    Schema.mutable(
      Schema.Struct({
        resourceType: Schema.Literal('Bundle'),
        entry: Schema.optional(
          Schema.mutable(Schema.Array(BundleEntry(contentTypeSchema)))
        ),
        identifier: Schema.optional(Schema.suspend(() => IdentifierFromFhirR4)),
        link: Schema.optional(Schema.mutable(Schema.Array(Schema.Any))),
        signature: Schema.optional(Schema.Any),
        timestamp: Schema.optional(Schema.String),
        total: Schema.optional(Schema.Number),
        type: BundleType,
      })
    )
  )
