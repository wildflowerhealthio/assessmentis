import { DateTime, Schema } from 'effect'

import { Encounter, Observation, Patient } from '@assessmentis/clinical-domain'
import {
  Code,
  CodeableConcept,
  Coding,
  DatatypeChoice,
  Quantity,
  Reference,
} from '@assessmentis/clinical-domain/data-types'
import type { Resource } from '@assessmentis/effectful-store'

export const ValueTypeEnum = Schema.Literal('valueString', 'valueQuantity', 'valueCodeableConcept')

const fields = {
  code: Schema.String,
  effectiveDateTime: Schema.optional(Schema.DateTimeZonedFromSelf),
  encounterUrl: Schema.optional(Encounter.UrlSchema),
  patientUrl: Schema.optional(Patient.UrlSchema),
  valueCodeableConceptCodingCode: Schema.optional(Schema.String),
  valueCodeableConceptCodingDisplay: Schema.optional(Schema.String),
  valueCodeableConceptCodingSystem: Schema.optional(Schema.String),
  valueCodeableConceptText: Schema.optional(Schema.String),
  valueQuantityUnit: Schema.optional(Schema.String),
  valueQuantityValue: Schema.optional(Schema.String),
  valueString: Schema.optional(Schema.String),
  valueType: Schema.optional(ValueTypeEnum),
} as const satisfies Schema.Struct.Fields

export class ObservationFormData extends Schema.Class<ObservationFormData>('ObservationFormData')(
  fields
) {
  static readonly defaultFormValues: typeof ObservationFormData.Encoded = {
    code: '',
    effectiveDateTime: undefined,
    encounterUrl: undefined,
    patientUrl: undefined,
    valueCodeableConceptCodingCode: undefined,
    valueCodeableConceptCodingDisplay: undefined,
    valueCodeableConceptCodingSystem: undefined,
    valueCodeableConceptText: undefined,
    valueQuantityUnit: undefined,
    valueQuantityValue: undefined,
    valueString: undefined,
    valueType: 'valueQuantity',
  }

  static fromResource(observation: Observation): typeof ObservationFormData.Encoded {
    // Use Datatype.from() to extract typed values from the choice union.
    // Quantity and CodeableConcept use PermissivePassthrough in the base
    // Datatypes, but Datatype.from() narrows correctly at runtime because
    // It checks the _tag discriminant.
    // oxlint-disable-next-line eslint/no-ternary -- ternary selects between match result and empty object
    const valueFields = observation.value
      ? DatatypeChoice.match(
          observation.value,
          {
            CodeableConcept: () => {
              const cc = CodeableConcept.Datatype.from(observation.value)
              const firstCoding = cc?.coding?.[0]
              return {
                valueType: 'valueCodeableConcept' as const,
                valueCodeableConceptText: cc?.text,
                valueCodeableConceptCodingCode: firstCoding?.code,
                valueCodeableConceptCodingSystem: firstCoding?.system,
                valueCodeableConceptCodingDisplay: firstCoding?.display,
              }
            },
            Quantity: () => {
              const q = Quantity.Datatype.from(observation.value)
              return {
                valueType: 'valueQuantity' as const,
                valueQuantityValue: q?.value?.toString(),
                valueQuantityUnit: q?.unit,
              }
            },
            string: (s) => ({
              valueType: 'valueString' as const,
              valueString: s,
            }),
          },
          () => ({})
        )
      : {}

    const effectiveDateTime = DatatypeChoice.cases(observation.effective).dateTime

    return {
      ...ObservationFormData.defaultFormValues,
      patientUrl: observation.subject?.reference,
      encounterUrl: observation.encounter?.reference,
      code: observation.code.text ?? '',
      ...valueFields,
      effectiveDateTime: effectiveDateTime?.pipe(DateTime.setZone(DateTime.zoneMakeLocal())),
    }
  }

  private toConstructorArgs(): ConstructorParameters<typeof Observation>[0] {
    let effective: ConstructorParameters<typeof Observation>[0]['effective']
    if (this.effectiveDateTime) {
      effective = {
        _tag: 'dateTime' as const,
        dateTime: this.effectiveDateTime.pipe(DateTime.toUtc),
      }
    }

    let encounter: Reference | undefined
    if (this.encounterUrl) {
      encounter = Reference.make({ reference: this.encounterUrl.toString() })
    }

    let subject: Reference | undefined
    if (this.patientUrl) {
      subject = Reference.make({ reference: this.patientUrl.toString() })
    }

    const base = {
      code: CodeableConcept.make({ text: this.code, coding: [] }),
      effective,
      encounter,
      status: 'preliminary' as const,
      subject,
    }

    switch (this.valueType) {
      case undefined: {
        return base
      }
      case 'valueString': {
        return { ...base, value: { _tag: 'string', string: this.valueString ?? '' } }
      }
      case 'valueQuantity': {
        let parsed: number | undefined
        if (this.valueQuantityValue?.trim()) {
          parsed = Number.parseFloat(this.valueQuantityValue)
        }
        let quantityValue: number | undefined
        if (parsed !== undefined && Number.isFinite(parsed)) {
          quantityValue = parsed
        }
        return {
          ...base,
          value: {
            Quantity: Quantity.make({ value: quantityValue, unit: this.valueQuantityUnit }),
            _tag: 'Quantity',
          },
        }
      }
      case 'valueCodeableConcept': {
        let coding: ReturnType<typeof Coding.make>[] = []
        if (this.valueCodeableConceptCodingCode) {
          coding = [
            Coding.make({
              code: Code.make(this.valueCodeableConceptCodingCode),
              display: this.valueCodeableConceptCodingDisplay,
              system: this.valueCodeableConceptCodingSystem,
            }),
          ]
        }
        return {
          ...base,
          value: {
            CodeableConcept: CodeableConcept.make({ text: this.valueCodeableConceptText, coding }),
            _tag: 'CodeableConcept',
          },
        }
      }
    }
  }

  private toResource(): Observation {
    return Observation.make(this.toConstructorArgs())
  }

  toCreatePayload(): Observation {
    return this.toResource()
  }

  toUpdatePayload(
    base: Resource.WithResourceUrl<Observation>
  ): Resource.WithResourceUrl<Observation> {
    return base.cloneWith({ ...this.toConstructorArgs(), url: base.url })
  }
}
