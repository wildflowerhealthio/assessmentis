import { Schema } from 'effect'

import { Observation, ObservationStatus } from '@assessmentis/clinical-domain'
import type { ObservationEncoded } from '@assessmentis/clinical-domain'
import { FhirR4ChoiceElements } from '@assessmentis/clinical-domain/data-types'
import { TwoStepExternalSchema, extendObjectSchemas, mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { FhirChoiceElementTransform } from '../../data-types/base/fhir-choice-element-transform'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/resource'
import { FhirR4Annotation } from '../../data-types/complex/annotation'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/identifier-and-reference'
import type { BaseUrl } from '../../data-types/url-identification'
import { ObservationComponentEncodedFromFhir } from './observation-component'
import { ObservationReferenceRangeEncodedFromFhir } from './observation-reference-range'

const EncodedFromFhir: Schema.Schema<ObservationEncoded, FhirR4.Observation, BaseUrl> =
  extendObjectSchemas(
    ResourceEncodedFromFhirR4Resource('Observation', 'Observation'),
    extendObjectSchemas(
      mutableEncoded(
        extendObjectSchemas(
          FhirChoiceElementTransform('value', FhirR4ChoiceElements['Observation.value[x]']),
          FhirChoiceElementTransform('effective', FhirR4ChoiceElements['Observation.effective[x]'])
        )
      ),
      mutableEncoded(
        Schema.Struct({
          basedOn: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          bodySite: Schema.optional(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          ),
          category: Schema.optional(
            mutableEncoded(
              Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
            )
          ),
          code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
          component: Schema.optional(
            mutableEncoded(Schema.Array(ObservationComponentEncodedFromFhir))
          ),
          dataAbsentReason: Schema.optional(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          ),
          derivedFrom: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          device: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
          encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
          focus: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          hasMember: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          identifier: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Identifier.EncodedFromExternal)))
          ),
          interpretation: Schema.optional(
            mutableEncoded(
              Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
            )
          ),
          issued: Schema.optional(Schema.String),
          method: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
          note: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Annotation.EncodedFromExternal)))
          ),
          partOf: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          performer: Schema.optional(
            mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
          ),
          referenceRange: Schema.optional(
            mutableEncoded(Schema.Array(ObservationReferenceRangeEncodedFromFhir))
          ),
          specimen: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
          status: ObservationStatus,
          subject: Schema.optional(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)),
        })
      )
    )
  )

export const FhirR4Observation = new TwoStepExternalSchema<
  Observation,
  ObservationEncoded,
  FhirR4.Observation,
  BaseUrl
>(Observation, EncodedFromFhir)
