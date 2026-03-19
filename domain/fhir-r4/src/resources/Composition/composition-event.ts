import { Schema } from 'effect'

import type { CompositionEventEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'
import { FhirR4Period } from '../../data-types/complex/period'
import type { BaseUrl } from '../../data-types/url-identification'

export const CompositionEventEncodedFromFhir: Schema.Schema<
  CompositionEventEncoded,
  FhirR4.CompositionEvent,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionEvent'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal))
        )
      ),
      detail: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
    })
  )
)
