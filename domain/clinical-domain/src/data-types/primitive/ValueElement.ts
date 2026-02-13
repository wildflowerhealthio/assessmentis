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
import type { DeepReadonly } from '@assessmentis/util'

// Local Quantity interface for ValueElement use
// (Full Quantity type doesn't exist yet, only SimpleQuantity)
interface Quantity {
  value?: number
  unit?: string
}

const QuantityFromFhirR4 = Schema.Struct({
  value: Schema.optional(Schema.Number),
  unit: Schema.optional(Schema.String),
}) satisfies Schema.Schema<Quantity, DeepReadonly<FhirQuantity>>

export interface ValueElement {
  readonly valueBoolean?: boolean

  readonly valueDecimal?: number

  readonly valueInteger?: number

  readonly valueDate?: Date

  readonly valueDateTime?: DateTime.Utc

  readonly valueTime?: string

  readonly valueString?: string

  readonly valueUrl?: string
  readonly valueAttachment?: Attachment

  readonly valueCoding?: Coding

  readonly valueQuantity?: Quantity
  readonly valueReference?: Reference

  readonly valueCode?: Code
  // _valueCode?: { extension?: Extension[] }
  readonly valueCodeableConcept?: CodeableConcept
  readonly valueCanonical?: string
}

export const ValueElementFromFhirR4: Schema.Schema<
  ValueElement,
  DeepReadonly<
    Pick<
      FhirExtension,
      | 'valueBoolean'
      | 'valueDecimal'
      | 'valueInteger'
      | 'valueDate'
      | 'valueDateTime'
      | 'valueTime'
      | 'valueString'
      | 'valueUrl'
      | 'valueAttachment'
      | 'valueCoding'
      | 'valueQuantity'
      | 'valueReference'
      | 'valueCode'
      | 'valueCodeableConcept'
      | 'valueCanonical'
    >
  >
> = Schema.Struct({
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
