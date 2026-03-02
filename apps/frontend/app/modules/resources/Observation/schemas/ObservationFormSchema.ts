import {
  Coding,
  Code,
  CodeableConcept,
  IdentifierAndReference,
} from '@assessmentis/clinical-domain/data-types'
import { Observation } from '@assessmentis/clinical-domain'
import { Schema, DateTime } from 'effect'

export const ValueTypeEnum = Schema.Literal(
  'valueString',
  'valueQuantity',
  'valueCodeableConcept'
)

export const ObservationFormSchema = Schema.Struct({
  patientId: Schema.optional(Schema.String),
  encounterId: Schema.optional(Schema.String),
  code: Schema.String,
  effectiveDateTime: Schema.optional(Schema.DateTimeZonedFromSelf),
  valueType: Schema.optional(ValueTypeEnum),
  // Fields for valueString
  valueString: Schema.optional(Schema.String),
  // Fields for valueQuantity (stored as string, parsed during transform)
  valueQuantityValue: Schema.optional(Schema.String),
  valueQuantityUnit: Schema.optional(Schema.String),
  // Fields for valueCodeableConcept
  valueCodeableConceptText: Schema.optional(Schema.String),
  valueCodeableConceptCodingCode: Schema.optional(Schema.String),
  valueCodeableConceptCodingSystem: Schema.optional(Schema.String),
  valueCodeableConceptCodingDisplay: Schema.optional(Schema.String),
})

export type ObservationFormData = typeof ObservationFormSchema.Type

export function transformToObservation(
  formData: ObservationFormData
): Observation {
  const base = {
    status: 'preliminary' as const,
    code: CodeableConcept.make({
      text: formData.code,
      coding: [],
    }),
    subject: formData.patientId
      ? IdentifierAndReference.Reference.make({
          reference: `Patient/${formData.patientId}`,
        })
      : undefined,
    encounter: formData.encounterId
      ? IdentifierAndReference.Reference.make({
          reference: `Encounter/${formData.encounterId}`,
        })
      : undefined,
    effectiveDateTime: formData.effectiveDateTime?.pipe(DateTime.toUtc),
  }
  // Add the appropriate value field based on valueType
  switch (formData.valueType) {
    case undefined:
      return Observation.make({
        ...base,
      })
    case 'valueString':
      return Observation.make({
        ...base,
        valueString: formData.valueString || '',
      })
    case 'valueQuantity': {
      const quantityValue = formData.valueQuantityValue
        ? parseFloat(formData.valueQuantityValue)
        : undefined
      return Observation.make({
        ...base,
        valueQuantity: {
          value: quantityValue,
          unit: formData.valueQuantityUnit,
        },
      })
    }
    case 'valueCodeableConcept': {
      const coding = formData.valueCodeableConceptCodingCode
        ? [
            Coding.Coding.make({
              system: formData.valueCodeableConceptCodingSystem,
              code: Code.make(formData.valueCodeableConceptCodingCode),
              display: formData.valueCodeableConceptCodingDisplay,
            }),
          ]
        : []
      return Observation.make({
        ...base,
        valueCodeableConcept: CodeableConcept.make({
          text: formData.valueCodeableConceptText,
          coding,
        }),
      })
    }
  }
}
