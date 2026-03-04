import { Schema } from 'effect'
import {
  Reference,
  type ReferenceEncoded,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

const DomainType = 'DiagnosticReportMedia' as const
type DomainType = typeof DomainType

const fields = {
  comment: Schema.optional(Schema.String),
  link: Schema.suspend(
    (): Schema.Schema<Reference, ReferenceEncoded> => Reference
  ),
} as const satisfies Schema.Struct.Fields

export interface DiagnosticReportMediaEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType> {}

export class DiagnosticReportMedia extends BackboneElement(
  DomainType
).extend<DiagnosticReportMedia>(DomainType)(fields) {}
