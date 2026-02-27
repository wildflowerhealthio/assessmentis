import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { type CompositionEventEncoded } from '@assessmentis/clinical-domain'
import { BackboneElementEncodedFromFhir } from '../../../data-types/base/BackboneElement'
import { ReferenceEncodedFromFhir } from '../../../data-types/complex/IdentifierAndReference'
import { CodeableConceptEncodedFromFhir } from '../../../data-types/complex/CodeableConcept'
import { PeriodEncodedFromFhir } from '../../../data-types/complex/Period'
import { mutableEncoded } from '@assessmentis/util'
import type { BaseUrl } from '../../../data-types/UrlIdentification'

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
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      period: Schema.optional(Schema.suspend(() => PeriodEncodedFromFhir)),
      detail: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
    })
  )
)
