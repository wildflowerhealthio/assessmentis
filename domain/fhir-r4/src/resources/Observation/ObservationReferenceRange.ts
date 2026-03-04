import { Schema } from 'effect'

import type { ObservationReferenceRangeEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Quantity } from '../../data-types/complex/Quantity'
import { FhirR4Range } from '../../data-types/complex/Range'
import type { BaseUrl } from '../../data-types/UrlIdentification'

export const ObservationReferenceRangeEncodedFromFhir: Schema.Schema<
  ObservationReferenceRangeEncoded,
  FhirR4.ObservationReferenceRange,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('ObservationReferenceRange'),
  mutableEncoded(
    Schema.Struct({
      low: Schema.optional(
        Schema.suspend(() => FhirR4Quantity.EncodedFromExternal)
      ),
      high: Schema.optional(
        Schema.suspend(() => FhirR4Quantity.EncodedFromExternal)
      ),
      type: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      appliesTo: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
          )
        )
      ),
      age: Schema.optional(
        Schema.suspend(() => FhirR4Range.EncodedFromExternal)
      ),
      text: Schema.optional(Schema.String),
    })
  )
)
