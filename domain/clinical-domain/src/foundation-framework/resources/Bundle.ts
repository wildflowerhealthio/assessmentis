import { Schema } from 'effect'
import type {
  Bundle as FhirBundle,
  BundleEntry as FhirBundleEntry,
} from 'fhir/r4'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type { Resource } from '../../data-types/base/Resource'
import { ResourceFromFhirR4 } from '../../data-types/base/Resource'
import type { Identifier } from '../../data-types/complex/IdentifierAndReference'
import { IdentifierFromFhirR4 } from '../../data-types/complex/IdentifierAndReference'
import type { DeepReadonly } from '@assessmentis/util'

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
  readonly fullUrl?: URL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly link?: ReadonlyArray<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly request?: any
  readonly resource?: BundleContentType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly response?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly search?: any
}

export interface Bundle<T> extends Resource<BundleId> {
  readonly resourceType: 'Bundle'
  readonly entry?: ReadonlyArray<BundleEntry<T>>
  readonly identifier?: Identifier
  readonly link?: ReadonlyArray<unknown>
  readonly signature?: unknown
  readonly timestamp?: string
  readonly total?: number
  readonly type: Schema.Schema.Type<typeof BundleType>
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
  Omit<DeepReadonly<FhirBundleEntry<unknown>>, 'resource'> & {
    readonly resource?: BundleContentEncoded | undefined
  }
> =>
  Schema.extend(
    BackboneElementFromFhirR4(BundleEntryId),
    Schema.Struct({
      fullUrl: Schema.optional(Schema.URL),
      link: Schema.optional(Schema.Array(Schema.Any)),
      request: Schema.optional(Schema.Any),
      resource: Schema.optional(contentTypeSchema),
      response: Schema.optional(Schema.Any),
      search: Schema.optional(Schema.Any),
    })
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
  Omit<DeepReadonly<FhirBundle>, 'entry'>,
  never
> =>
  Schema.extend(
    ResourceFromFhirR4(BundleId),
    Schema.Struct({
      resourceType: Schema.Literal('Bundle'),
      entry: Schema.optional(Schema.Array(BundleEntry(contentTypeSchema))),
      identifier: Schema.optional(Schema.suspend(() => IdentifierFromFhirR4)),
      link: Schema.optional(Schema.Array(Schema.Any)),
      signature: Schema.optional(Schema.Any),
      timestamp: Schema.optional(Schema.String),
      total: Schema.optional(Schema.Number),
      type: BundleType,
    })
  )
