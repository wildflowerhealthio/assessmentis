import { DateTime, Effect, Schema } from 'effect'
import type { Observation } from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { ResourcePagesConfig } from '../ResourcePages/resourcePagesConfigType'
import { ObservationForm } from './components/ObservationForm'
import {
  ObservationFormSchema,
  transformToObservation,
  type ObservationFormData,
} from './schemas/ObservationFormSchema'
import {
  createResourceCreateAction,
  createResourceUpdateAction,
} from '../../common/actions/createResourceActions'
import {
  getObservationDisplayName,
  getObservationStatus,
  getObservationEffectiveDate,
  formatObservationValue,
} from './utils/observationDisplay'
import { extractReferenceId } from '../../common/utils/fhirDisplay'
import { runEffectSyncFlat } from '../../../runEffectSync'
import { ObservationFiltersBridge } from './components/ObservationFiltersBridge'

export const observationConfig: ResourcePagesConfig<
  Observation,
  typeof ObservationFormSchema
> = {
  resourceType: 'Observation',
  singularLabel: 'Observation',
  pluralLabel: 'Observations',
  paramName: 'observationId',

  decodeUrl: (raw: string) => Schema.decodeOption(ReadonlyUrl.FromString)(raw),
  getDisplayName: getObservationDisplayName,

  schema: ObservationFormSchema,
  FormComponent: ObservationForm,

  defaultFormValues: {
    patientId: undefined,
    encounterId: undefined,
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
  },

  extractFormValues: (observation) => {
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
      patientId: extractReferenceId(observation.subject) ?? '',
      encounterId: extractReferenceId(observation.encounter),
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
  },

  createAction: createResourceCreateAction<ObservationFormData, 'Observation'>(
    'Observation',
    transformToObservation
  ),
  updateAction: createResourceUpdateAction<ObservationFormData, 'Observation'>(
    'Observation',
    transformToObservation
  ),

  getListSummaryItems: (observation) => {
    const { effectiveDate, value } = runEffectSyncFlat(
      Effect.gen(function* () {
        return {
          effectiveDate: yield* getObservationEffectiveDate(observation),
          value: yield* formatObservationValue(observation),
        }
      })
    )
    return [getObservationStatus(observation), effectiveDate, `Value: ${value}`]
  },
  FilterComponent: ObservationFiltersBridge,
}
