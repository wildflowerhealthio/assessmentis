import { Schema } from 'effect'

import type { ObservationComponentEncoded } from '@assessmentis/clinical-domain'
import { FhirR4ChoiceElements } from '@assessmentis/clinical-domain/data-types'
import { extendObjectSchemas, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirChoiceElementTransform } from '../../data-types/base/fhir-choice-element-transform'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import type { BaseUrl } from '../../data-types/url-identification'
import { ObservationReferenceRangeEncodedFromFhir } from './observation-reference-range'

export const ObservationComponentEncodedFromFhir: Schema.Schema<
  ObservationComponentEncoded,
  FhirR4.ObservationComponent,
  BaseUrl
> = extendObjectSchemas(
  BackboneElementEncodedFromFhir('ObservationComponent'),
  extendObjectSchemas(
    mutableEncoded(
      Schema.Struct({
        code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
        dataAbsentReason: Schema.optional(
          Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
        ),
        interpretation: Schema.optional(
          mutableEncoded(
            Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
          )
        ),
        referenceRange: Schema.optional(
          mutableEncoded(Schema.Array(ObservationReferenceRangeEncodedFromFhir))
        ),
      })
    ),
    FhirChoiceElementTransform('value', FhirR4ChoiceElements['Observation.component.value[x]'])
  )
)
