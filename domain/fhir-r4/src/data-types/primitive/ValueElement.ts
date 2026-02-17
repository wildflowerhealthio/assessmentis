import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type {
  ValueElement,
  ValueElementEncoded,
} from '@assessmentis/clinical-domain/data-types'
import { Code } from '@assessmentis/clinical-domain/data-types'
import { FhirR4Element } from '../base/Element'
import { FhirR4Coding } from '../complex/Coding'
import { FhirR4Reference } from '../complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../complex/CodeableConcept'
import { FhirR4Attachment } from '../complex/Attachment'

const QuantitySchema = Schema.Struct({
  value: Schema.optional(Schema.Number),
  unit: Schema.optional(Schema.String),
})

const ValueElementSchema: Schema.Schema<
  ValueElement,
  Omit<FhirR4.Extension, 'url' | '_url'>,
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
    valueAttachment: Schema.optional(FhirR4Attachment.Schema),
    valueCoding: Schema.optional(FhirR4Coding.Schema),
    valueQuantity: Schema.optional(QuantitySchema),
    valueReference: Schema.optional(
      Schema.suspend(() => FhirR4Reference.Schema)
    ),
    valueCode: Schema.optional(Code),
    _valueCode: Schema.optional(FhirR4Element.Schema(Schema.String)),
    valueCodeableConcept: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    valueCanonical: Schema.optional(Schema.String),
  })
)

export const FhirR4ValueElement = {
  Schema: ValueElementSchema,
}
