import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { Element, type ElementEncoded } from '../'
import { Code, Coding, type CodingEncoded } from '../complex/Coding'
import {
  Reference,
  type ReferenceEncoded,
} from '../complex/IdentifierAndReference'
import { CodeableConcept, type CodeableConceptEncoded } from '../complex'
import { Attachment, type AttachmentEncoded } from '../complex/Attachment'

// Local Quantity interface for ValueElement use
// (Full Quantity type doesn't exist yet, only SimpleQuantity)
interface Quantity {
  value?: number
  unit?: string
}

interface QuantityEncoded {
  value?: number
  unit?: string
}

const QuantitySchema = Schema.Struct({
  value: Schema.optional(Schema.Number),
  unit: Schema.optional(Schema.String),
})

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
  _valueCode?: Element
  valueCodeableConcept?: CodeableConcept
  valueCanonical?: string
}

export interface ValueElementEncoded {
  valueBoolean?: boolean

  valueDecimal?: number

  valueInteger?: number

  valueDate?: string

  valueDateTime?: string

  valueTime?: string

  valueString?: string

  valueUrl?: string
  valueAttachment?: AttachmentEncoded

  valueCoding?: CodingEncoded

  valueQuantity?: QuantityEncoded
  valueReference?: ReferenceEncoded

  valueCode?: string
  _valueCode?: ElementEncoded
  valueCodeableConcept?: CodeableConceptEncoded
  valueCanonical?: string
}

const ValueElementSchema: Schema.Schema<
  ValueElement,
  ValueElementEncoded,
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
    valueAttachment: Schema.optional(Attachment.Schema),
    valueCoding: Schema.optional(Coding.Schema),
    valueQuantity: Schema.optional(QuantitySchema),
    valueReference: Schema.optional(Schema.suspend(() => Reference.Schema)),
    valueCode: Schema.optional(Code),
    _valueCode: Schema.optional(Element.Schema(Schema.String)),
    valueCodeableConcept: Schema.optional(
      Schema.suspend(() => CodeableConcept.Schema)
    ),
    valueCanonical: Schema.optional(Schema.String),
  })
)

export const ValueElement = {
  Schema: ValueElementSchema,
}
