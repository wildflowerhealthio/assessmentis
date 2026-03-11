import { Schema } from 'effect'

import {
  BackboneElement,
  Reference,
  type BackboneElementEncoded,
  type ReferenceEncoded,
} from '../../data-types'

const DomainType = 'DiagnosticReportMedia' as const
type DomainType = typeof DomainType

const fields = {
  comment: Schema.optional(Schema.String),
  link: Schema.suspend(
    (): Schema.Schema<Reference, ReferenceEncoded> => Reference
  ),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of a {@link DiagnosticReportMedia}. */
export interface DiagnosticReportMediaEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType> {}

/** A reference to a key image or media associated with a {@link DiagnosticReport}. */
export class DiagnosticReportMedia extends BackboneElement(
  DomainType
).extend<DiagnosticReportMedia>(DomainType)(fields) {}
