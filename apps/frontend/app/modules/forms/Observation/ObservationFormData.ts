import { DateTime, Schema } from 'effect'

import { Encounter, Observation, Patient } from '@assessmentis/clinical-domain'
import {
  Code,
  CodeableConcept,
  Coding,
  DatatypeChoice,
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
    // PermissivePassthrough types (Quantity, CodeableConcept) still need casts
    // at this form boundary where we know the runtime shape.
    const valueFields = observation.value
      ? DatatypeChoice.match(
          observation.value,
          {
            string: (s) => ({
              valueType: 'valueString' as const,
              valueString: s,
            }),
            Quantity: (q) => {
              const typed = q as { value?: number; unit?: string } | undefined
              return {
                valueType: 'valueQuantity' as const,
                valueQuantityValue: typed?.value?.toString(),
                valueQuantityUnit: typed?.unit,
              }
            },
            CodeableConcept: (cc) => {
              const typed = cc as
                | {
                    text?: string
                    coding?: Array<{
                      code?: string
                      system?: string
                      display?: string
                    }>
                  }
                | undefined
              const firstCoding = typed?.coding?.[0]
              return {
                valueType: 'valueCodeableConcept' as const,
                valueCodeableConceptText: typed?.text,
                valueCodeableConceptCodingCode: firstCoding?.code,
                valueCodeableConceptCodingSystem: firstCoding?.system,
                valueCodeableConceptCodingDisplay: firstCoding?.display,
              }
            },
          },
          () => ({})
        )
      : {}

    const effectiveDateTime = DatatypeChoice.cases(
      observation.effective
    ).dateTime

    return {
      ...ObservationFormData.defaultFormValues,
      patientUrl: observation.subject?.reference,
      encounterUrl: observation.encounter?.reference,
      code: observation.code.text ?? '',
      ...valueFields,
      effectiveDateTime: effectiveDateTime?.pipe(
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
      effective: this.effectiveDateTime
        ? {
            _tag: 'dateTime' as const,
            dateTime: this.effectiveDateTime.pipe(DateTime.toUtc),
          }
        : undefined,
    }

    switch (this.valueType) {
      case undefined:
        return Observation.make({
          ...base,
        })
      case 'valueString':
        return Observation.make({
          ...base,
          value: { _tag: 'string', string: this.valueString || '' },
        })
      case 'valueQuantity': {
        const quantityValue = this.valueQuantityValue
          ? parseFloat(this.valueQuantityValue)
          : undefined
        return Observation.make({
          ...base,
          value: {
            _tag: 'Quantity',
            Quantity: {
              value: quantityValue,
              unit: this.valueQuantityUnit,
            },
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
          value: {
            _tag: 'CodeableConcept',
            CodeableConcept: CodeableConcept.make({
              text: this.valueCodeableConceptText,
              coding,
            }),
          },
        })
      }
    }
  }

  toCreatePayload(): Observation {
    return this.toResource()
  }

  toUpdatePayload(base: Observation): Resource.WithResourceUrl<Observation> {
    if (!base.url) throw new Error('Cannot update resource without url')
    return { ...base, ...this.toResource(), url: base.url }
  }
}
