import { Schema } from 'effect'

import type { ObservationReferenceRangeEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Quantity } from '../../data-types/complex/quantity'
import { FhirR4Range } from '../../data-types/complex/range'
import type { BaseUrl } from '../../data-types/url-identification'

export const ObservationReferenceRangeEncodedFromFhir: Schema.Schema<
  ObservationReferenceRangeEncoded,
  FhirR4.ObservationReferenceRange,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('ObservationReferenceRange'),
  mutableEncoded(
    Schema.Struct({
      age: Schema.optional(Schema.suspend(() => FhirR4Range.EncodedFromExternal)),
      appliesTo: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      high: Schema.optional(Schema.suspend(() => FhirR4Quantity.EncodedFromExternal)),
      low: Schema.optional(Schema.suspend(() => FhirR4Quantity.EncodedFromExternal)),
      text: Schema.optional(Schema.String),
      type: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
    })
  )
)
