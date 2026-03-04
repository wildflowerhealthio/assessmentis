import {
  Coding,
  Code,
  CodeableConcept,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import { Encounter, Observation, Patient } from '@assessmentis/clinical-domain'
import { Schema, DateTime } from 'effect'

export const ValueTypeEnum = Schema.Literal(
  'valueString',
  'valueQuantity',
  'valueCodeableConcept'
)

export const ObservationFormSchema = Schema.Struct({
  patientUrl: Schema.optional(Patient.UrlSchema),
  encounterUrl: Schema.optional(Encounter.UrlSchema),
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
    subject: formData.patientUrl
      ? Reference.make({
          reference: formData.patientUrl.toString(),
        })
      : undefined,
    encounter: formData.encounterUrl
      ? Reference.make({
          reference: formData.encounterUrl.toString(),
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
            Coding.make({
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
