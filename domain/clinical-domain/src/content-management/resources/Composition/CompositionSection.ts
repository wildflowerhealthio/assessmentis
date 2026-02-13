import { Schema } from 'effect'
import type { CompositionSection as FhirCompositionSection } from 'fhir/r4'
import type { BackboneElement } from '../../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../../data-types/base/BackboneElement'
import type { Reference } from '../../../data-types/complex/IdentifierAndReference'
import { ReferenceFromFhirR4 } from '../../../data-types/complex/IdentifierAndReference'
import type { CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../../data-types/complex/CodeableConcept'
import { Narrative } from '../../../data-types/special-purpose/Narrative'
import type { DeepReadonly } from '@assessmentis/util'

const CompositionSectionId = Schema.String.pipe(
  Schema.brand('CompositionSectionSectionId')
)
type CompositionSectionId = typeof CompositionSectionId.Type

export interface CompositionSection extends BackboneElement<CompositionSectionId> {
  title?: string
  code?: CodeableConcept
  text?: Narrative
  mode?: 'working' | 'snapshot' | 'changes'
  orderedBy?: CodeableConcept
  entry?: ReadonlyArray<Reference>
  emptyReason?: CodeableConcept
  section?: ReadonlyArray<CompositionSection>
}

/**
 * Composition is broken into sections
 */
export const CompositionSectionFromFhirR4: Schema.Schema<
  CompositionSection,
  DeepReadonly<FhirCompositionSection>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(CompositionSectionId),
  Schema.Struct({
    title: Schema.optional(Schema.String),
    code: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
    text: Schema.optional(Schema.suspend(() => Narrative)),
    mode: Schema.optional(
      Schema.Union(
        Schema.Literal('working'),
        Schema.Literal('snapshot'),
        Schema.Literal('changes')
      )
    ),
    orderedBy: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
    entry: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
    emptyReason: Schema.optional(
      Schema.suspend(() => CodeableConceptFromFhirR4)
    ),
    section: Schema.optional(
      Schema.Array(
        Schema.suspend(
          (): Schema.Schema<
            CompositionSection,
            DeepReadonly<FhirCompositionSection>,
            never
          > => CompositionSectionFromFhirR4
        )
      )
    ),
  })
)
