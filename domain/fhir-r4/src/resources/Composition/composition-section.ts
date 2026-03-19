import { Schema } from 'effect'

import type { CompositionSectionEncoded } from '@assessmentis/clinical-domain'
import { mutableEncoded } from '@assessmentis/util'

import type FhirR4 from 'fhir/r4'

import { BackboneElementEncodedFromFhir } from '../../data-types/base/backbone-element'
import { FhirR4CodeableConcept } from '../../data-types/complex/codeable-concept'
import { FhirR4Reference } from '../../data-types/complex/identifier-and-reference'
import { FhirR4Narrative } from '../../data-types/special-purpose/narrative'
import type { BaseUrl } from '../../data-types/url-identification'

export const CompositionSectionEncodedFromFhir: Schema.Schema<
  CompositionSectionEncoded,
  FhirR4.CompositionSection,
  BaseUrl
> = Schema.extend(
  BackboneElementEncodedFromFhir('CompositionSection'),
  mutableEncoded(
    Schema.Struct({
      code: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      emptyReason: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      entry: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => FhirR4Reference.EncodedFromExternal)))
      ),
      mode: Schema.optional(
        Schema.Union(
          Schema.Literal('working'),
          Schema.Literal('snapshot'),
          Schema.Literal('changes')
        )
      ),
      orderedBy: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.EncodedFromExternal)),
      section: Schema.optional(
        mutableEncoded(Schema.Array(Schema.suspend(() => CompositionSectionEncodedFromFhir)))
      ),
      text: Schema.optional(Schema.suspend(() => FhirR4Narrative.EncodedFromExternal)),
      title: Schema.optional(Schema.String),
    })
  )
)
