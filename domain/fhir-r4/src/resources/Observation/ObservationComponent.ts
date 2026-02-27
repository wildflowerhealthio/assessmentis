import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  AllDatatypeKeys,
  DatatypeChoiceEncodedPassthroughFields,
} from '@assessmentis/clinical-domain/data-types'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { ObservationReferenceRangeEncodedFromFhir } from './ObservationReferenceRange'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import type { ObservationComponentEncoded } from '@assessmentis/clinical-domain'

export const ObservationComponentEncodedFromFhir: Schema.Schema<
  ObservationComponentEncoded,
  FhirR4.ObservationComponent,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('ObservationComponent'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      interpretation: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      referenceRange: Schema.optional(
        mutableEncoded(Schema.Array(ObservationReferenceRangeEncodedFromFhir))
      ),
      ...DatatypeChoiceEncodedPassthroughFields('value', AllDatatypeKeys),
    })
  )
)
