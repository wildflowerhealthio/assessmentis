import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type {
  Extension as FhirExtension,
  Quantity as FhirQuantity,
} from 'fhir/r4'

import { Code, Coding } from '../complex/Coding'
import type { Reference } from '../complex/IdentifierAndReference'
import { ReferenceFromFhirR4 } from '../complex/IdentifierAndReference'
import { CodeableConceptFromFhirR4, type CodeableConcept } from '../complex'
import type { Attachment } from '../complex/Attachment'
import { AttachmentFromFhirR4 } from '../complex/Attachment'

// Local Quantity interface for ValueElement use
// (Full Quantity type doesn't exist yet, only SimpleQuantity)
interface Quantity {
  value?: number
  unit?: string
}

const QuantityFromFhirR4: Schema.Schema<Quantity, FhirQuantity> = Schema.Struct(
  {
    value: Schema.optional(Schema.Number),
    unit: Schema.optional(Schema.String),
  }
)
export interface ValueElement {
  valueBoolean?: boolean

  valueDecimal?: number

  valueInteger?: number

  valueDate?: Date

  valueDateTime?: DateTime.Utc

  valueTime?: string

  valueString?: string

  valueUrl?: string
  valueAttachment?: Attachment

  valueCoding?: Coding

  valueQuantity?: Quantity
  valueReference?: Reference

  valueCode?: Code
  // _valueCode?: { extension?: Extension[] }
  valueCodeableConcept?: CodeableConcept
  valueCanonical?: string
}

export type DefinedValueElement = Omit<FhirExtension, 'url' | '_url'>

export const ValueElementFromFhirR4: Schema.Schema<
  ValueElement,
  DefinedValueElement,
  never
> = Schema.mutable(
  Schema.Struct({
    valueBoolean: Schema.optional(Schema.Boolean),
    valueDecimal: Schema.optional(Schema.Number),
    valueInteger: Schema.optional(Schema.Number),
    valueDate: Schema.optional(Schema.DateFromString),
    valueDateTime: Schema.optional(Schema.DateTimeUtc),
    valueTime: Schema.optional(Schema.String),
    valueString: Schema.optional(Schema.String),
    valueUrl: Schema.optional(Schema.String),
    valueAttachment: Schema.optional(AttachmentFromFhirR4),
    valueCoding: Schema.optional(Coding),
    valueQuantity: Schema.optional(QuantityFromFhirR4),
    valueReference: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    valueCode: Schema.optional(Code),
    valueCodeableConcept: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    valueCanonical: Schema.optional(Schema.String),
  })
)
