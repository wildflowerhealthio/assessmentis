import { Schema } from 'effect'

import { type CompositionSectionEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Reference } from '../../data-types/complex/IdentifierAndReference'
import { FhirR4Narrative } from '../../data-types/special-purpose/Narrative'
import type { BaseUrl } from '../../data-types/UrlIdentification'

export const CompositionSectionEncodedFromFhir: Schema.Schema<
  CompositionSectionEncoded,
  FhirR4.CompositionSection,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionSection'),
  mutableEncoded(
    Schema.Struct({
      title: Schema.optional(Schema.String),
      code: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      text: Schema.optional(
        Schema.suspend(() => FhirR4Narrative.EncodedFromExternal)
      ),
      mode: Schema.optional(
        Schema.Union(
          Schema.Literal('working'),
          Schema.Literal('snapshot'),
          Schema.Literal('changes')
        )
      ),
      orderedBy: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      entry: Schema.optional(
        mutableEncoded(
          Schema.Array(
            Schema.suspend(() => FhirR4Reference.EncodedFromExternal)
          )
        )
      ),
      emptyReason: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)
      ),
      section: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CompositionSectionEncodedFromFhir))
        )
      ),
    })
  )
)
