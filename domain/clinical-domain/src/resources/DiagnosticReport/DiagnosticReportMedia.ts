import { Schema } from 'effect'
import {
  IdentifierAndReference,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'

const DomainType = 'DiagnosticReportMedia' as const
type DomainType = typeof DomainType

const fields = {
  comment: Schema.optional(Schema.String),
  link: Schema.suspend(
    (): Schema.Schema<
      IdentifierAndReference.Reference,
      IdentifierAndReference.ReferenceEncoded
    > => IdentifierAndReference.Reference
  ),
} as const satisfies Schema.Struct.Fields

export interface DiagnosticReportMediaEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType> {}

export class DiagnosticReportMedia extends BackboneElement(
  DomainType
).extend<DiagnosticReportMedia>(DomainType)(fields) {}
