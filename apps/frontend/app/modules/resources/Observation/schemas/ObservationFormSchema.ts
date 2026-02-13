import type { Coding } from '@assessmentis/clinical-domain/data-types'
import { Code } from '@assessmentis/clinical-domain/data-types'
import type { Observation } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { Schema, DateTime } from 'effect'

export const ValueTypeEnum = Schema.Literal(
  'valueString',
  'valueDecimal',
  'valueQuantity',
  'valueCodeableConcept'
)

export const ObservationFormSchema = Schema.Struct({
  patientId: Schema.optional(Schema.String),
  encounterId: Schema.optional(Schema.String),
  code: Schema.String,
  valueType: Schema.optional(ValueTypeEnum),
  // Fields for valueString
  valueString: Schema.optional(Schema.String),
  // Fields for valueDecimal (stored as string, parsed during transform)
  valueDecimal: Schema.optional(Schema.String),
  // Fields for valueQuantity (stored as string, parsed during transform)
  valueQuantityValue: Schema.optional(Schema.String),
  valueQuantityUnit: Schema.optional(Schema.String),
  // Fields for valueCodeableConcept
  valueCodeableConceptText: Schema.optional(Schema.String),
  valueCodeableConceptCodingCode: Schema.optional(Schema.String),
  valueCodeableConceptCodingSystem: Schema.optional(Schema.String),
  valueCodeableConceptCodingDisplay: Schema.optional(Schema.String),
  effectiveDateTime: Schema.optional(Schema.DateTimeZonedFromSelf),
})

export type ObservationFormData = typeof ObservationFormSchema.Type

export function transformToObservation(
  formData: ObservationFormData
): Observation {
  const base = {
    resourceType: 'Observation' as const,
    status: 'preliminary' as const,
    code: {
      text: formData.code,
      coding: [],
    },
    subject: formData.patientId
      ? { reference: `Patient/${formData.patientId}` }
      : undefined,
    encounter: formData.encounterId
      ? { reference: `Encounter/${formData.encounterId}` }
      : undefined,
    effectiveDateTime: formData.effectiveDateTime?.pipe(DateTime.toUtc),
  } satisfies Omit<Observation, 'id'>
  // Add the appropriate value field based on valueType
  switch (formData.valueType) {
    case undefined:
      return {
        ...base,
      } satisfies Observation
    case 'valueString':
      return {
        ...base,
        valueString: formData.valueString || '',
      } satisfies Observation
    case 'valueDecimal': {
      const decimalValue = formData.valueDecimal
        ? parseFloat(formData.valueDecimal)
        : 0
      return {
        ...base,
        valueDecimal: decimalValue,
      } satisfies Observation
    }
    case 'valueQuantity': {
      const quantityValue = formData.valueQuantityValue
        ? parseFloat(formData.valueQuantityValue)
        : undefined
      return {
        ...base,
        valueQuantity: {
          value: quantityValue,
          unit: formData.valueQuantityUnit,
        },
      } satisfies Observation
    }
    case 'valueCodeableConcept': {
      const coding = formData.valueCodeableConceptCodingCode
        ? [
            {
              system: formData.valueCodeableConceptCodingSystem,
              code: Code.make(formData.valueCodeableConceptCodingCode),
              display: formData.valueCodeableConceptCodingDisplay,
            } satisfies Coding,
          ]
        : []
      return {
        ...base,
        valueCodeableConcept: {
          text: formData.valueCodeableConceptText,
          coding,
        },
      } satisfies Observation
    }
  }
}
