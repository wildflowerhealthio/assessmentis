import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { type CompositionEventEncoded } from '@assessmentis/clinical-domain'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Period } from '../../data-types/complex/Period'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../../data-types/UrlIdentification'

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
      period: Schema.optional(Schema.suspend(() => FhirR4Period.EncodedFromExternal)),
      detail: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal))
        )
      ),
    })
  )
)
