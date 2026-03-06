import { DateTime, Schema } from 'effect'

import { Encounter, Observation, Patient } from '@assessmentis/clinical-domain'
import {
  Code,
  CodeableConcept,
  Coding,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

export const ValueTypeEnum = Schema.Literal(
  'valueString',
  'valueQuantity',
  'valueCodeableConcept'
)

const fields = {
  patientUrl: Schema.optional(Patient.UrlSchema),
  encounterUrl: Schema.optional(Encounter.UrlSchema),
  code: Schema.String,
  effectiveDateTime: Schema.optional(Schema.DateTimeZonedFromSelf),
  valueType: Schema.optional(ValueTypeEnum),
  valueString: Schema.optional(Schema.String),
  valueQuantityValue: Schema.optional(Schema.String),
  valueQuantityUnit: Schema.optional(Schema.String),
  valueCodeableConceptText: Schema.optional(Schema.String),
  valueCodeableConceptCodingCode: Schema.optional(Schema.String),
  valueCodeableConceptCodingSystem: Schema.optional(Schema.String),
  valueCodeableConceptCodingDisplay: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

export class ObservationFormData extends Schema.Class<ObservationFormData>(
  'ObservationFormData'
)(fields) {
  static readonly defaultFormValues: typeof ObservationFormData.Encoded = {
    patientUrl: undefined,
    encounterUrl: undefined,
    code: '',
    valueType: 'valueQuantity',
    valueString: undefined,
    valueQuantityValue: undefined,
    valueQuantityUnit: undefined,
    valueCodeableConceptText: undefined,
    valueCodeableConceptCodingCode: undefined,
    valueCodeableConceptCodingSystem: undefined,
    valueCodeableConceptCodingDisplay: undefined,
    effectiveDateTime: undefined,
  }

  static fromResource(
    observation: Observation
  ): typeof ObservationFormData.Encoded {
    let valueType: 'valueString' | 'valueQuantity' | 'valueCodeableConcept' =
      'valueQuantity'
    if ('valueString' in observation) valueType = 'valueString'
    else if ('valueQuantity' in observation) valueType = 'valueQuantity'
    else if ('valueCodeableConcept' in observation)
      valueType = 'valueCodeableConcept'

    const firstCoding =
      'valueCodeableConcept' in observation
        ? observation.valueCodeableConcept?.coding?.[0]
        : undefined

    return {
      patientUrl: observation.subject?.reference,
      encounterUrl: observation.encounter?.reference,
      code: observation.code.text ?? '',
      valueType,
      valueString:
        'valueString' in observation ? observation.valueString : undefined,
      valueQuantityValue:
        'valueQuantity' in observation
          ? observation.valueQuantity?.value?.toString()
          : undefined,
      valueQuantityUnit:
        'valueQuantity' in observation
          ? observation.valueQuantity?.unit
          : undefined,
      valueCodeableConceptText:
        'valueCodeableConcept' in observation
          ? observation.valueCodeableConcept?.text
          : undefined,
      valueCodeableConceptCodingCode: firstCoding?.code,
      valueCodeableConceptCodingSystem: firstCoding?.system,
      valueCodeableConceptCodingDisplay: firstCoding?.display,
      effectiveDateTime: observation.effectiveDateTime?.pipe(
        DateTime.setZone(DateTime.zoneMakeLocal())
      ),
    }
  }

  private toResource(): Observation {
    const base = {
      status: 'preliminary' as const,
      code: CodeableConcept.make({
        text: this.code,
        coding: [],
      }),
      subject: this.patientUrl
        ? Reference.make({
            reference: this.patientUrl.toString(),
          })
        : undefined,
      encounter: this.encounterUrl
        ? Reference.make({
            reference: this.encounterUrl.toString(),
          })
        : undefined,
      effectiveDateTime: this.effectiveDateTime?.pipe(DateTime.toUtc),
    }

    switch (this.valueType) {
      case undefined:
        return Observation.make({
          ...base,
        })
      case 'valueString':
        return Observation.make({
          ...base,
          valueString: this.valueString || '',
        })
      case 'valueQuantity': {
        const quantityValue = this.valueQuantityValue
          ? parseFloat(this.valueQuantityValue)
          : undefined
        return Observation.make({
          ...base,
          valueQuantity: {
            value: quantityValue,
            unit: this.valueQuantityUnit,
          },
        })
      }
      case 'valueCodeableConcept': {
        const coding = this.valueCodeableConceptCodingCode
          ? [
              Coding.make({
                system: this.valueCodeableConceptCodingSystem,
                code: Code.make(this.valueCodeableConceptCodingCode),
                display: this.valueCodeableConceptCodingDisplay,
              }),
            ]
          : []
        return Observation.make({
          ...base,
          valueCodeableConcept: CodeableConcept.make({
            text: this.valueCodeableConceptText,
            coding,
          }),
        })
      }
    }
  }

  toCreatePayload(): Observation {
    return this.toResource()
  }

  toUpdatePayload(
    base: Observation
  ): Resource.WithResourceUrl<Observation> {
    if (!base.url) throw new Error('Cannot update resource without url')
    return { ...base, ...this.toResource(), url: base.url }
  }
}
