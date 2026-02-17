import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CompositionSection } from '@assessmentis/clinical-domain/content-management'
import { FhirR4BackboneElement } from '../../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { FhirR4Narrative } from '../../../data-types/special-purpose/Narrative'

const CompositionSectionId = Schema.String.pipe(
  Schema.brand('CompositionSectionSectionId')
)

const FhirR4CompositionSectionSchema: Schema.Schema<
  CompositionSection,
  FhirR4.CompositionSection,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(CompositionSectionId),
  Schema.Struct({
    title: Schema.optional(Schema.String),
    code: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    text: Schema.optional(Schema.suspend(() => FhirR4Narrative.Schema)),
    mode: Schema.optional(
      Schema.Union(
        Schema.Literal('working'),
        Schema.Literal('snapshot'),
        Schema.Literal('changes')
      )
    ),
    orderedBy: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    entry: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
      )
    ),
    emptyReason: Schema.optional(
      Schema.suspend(() => FhirR4CodeableConcept.Schema)
    ),
    section: Schema.optional(
      Schema.mutable(
        Schema.Array(
          Schema.suspend(() => FhirR4CompositionSectionSchema)
        )
      )
    ),
  })
)

export const FhirR4CompositionSection = {
  Schema: FhirR4CompositionSectionSchema,
}
