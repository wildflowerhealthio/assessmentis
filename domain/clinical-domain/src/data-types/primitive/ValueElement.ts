import { Schema } from 'effect'

import { Element } from '../base/Element'
import { Attachment, type AttachmentEncoded } from '../complex/Attachment'
import { Code } from '../complex/Code'
import {
  CodeableConcept,
  type CodeableConceptEncoded,
} from '../complex/CodeableConcept'
import { Coding, type CodingEncoded } from '../complex/Coding'
import {
  Reference,
  type ReferenceEncoded,
} from '../complex/IdentifierAndReference'
import { Quantity, type QuantityEncoded } from '../complex/Quantity'

const valueCode = Element('valueCode')

const fields = {
  valueBoolean: Schema.optional(Schema.Boolean),
  valueDecimal: Schema.optional(Schema.Number),
  valueInteger: Schema.optional(Schema.Number),
  valueDate: Schema.optional(Schema.DateFromString),
  valueDateTime: Schema.optional(Schema.DateTimeUtc),
  valueTime: Schema.optional(Schema.String),
  valueString: Schema.optional(Schema.String),
  valueUrl: Schema.optional(Schema.String),
  valueCode: Schema.optional(Code),
  valueCanonical: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

/**
 * Encoded (wire-format) shape of a {@link ValueElement}.
 *  @deprecated
 */
export interface ValueElementEncoded extends Schema.Struct.Encoded<
  typeof fields
> {
  valueAttachment?: AttachmentEncoded
  valueCoding?: CodingEncoded
  valueQuantity?: QuantityEncoded
  valueReference?: ReferenceEncoded
  valueCodeableConcept?: CodeableConceptEncoded
  _valueCode?: typeof valueCode.Encoded
}
/**
 * A FHIR element that carries a polymorphic value via `value[x]` fields.
 * Includes both primitive (`valueString`, `valueBoolean`, etc.) and complex
 * (`valueCoding`, `valueQuantity`, etc.) value types.
 * @deprecated
 */
export type ValueElement = Schema.Struct.Type<typeof fields> & {
  valueAttachment?: Attachment
  valueCoding?: Coding
  valueQuantity?: Quantity
  valueReference?: Reference
  valueCodeableConcept?: CodeableConcept
  _valueCode?: typeof valueCode.Type
}
/**
 * @deprecated
 */
export const ValueElement = Schema.Struct({
  ...fields,
  valueAttachment: Schema.optional(Attachment),
  valueCoding: Schema.optional(Coding),
  valueQuantity: Schema.optional(Quantity),
  valueReference: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<Reference, ReferenceEncoded, never> => Reference
    )
  ),
  valueCodeableConcept: Schema.optional(
    Schema.suspend(
      (): Schema.Schema<CodeableConcept, CodeableConceptEncoded, never> =>
        CodeableConcept
    )
  ),
  _valueCode: Schema.optional(valueCode),
})
