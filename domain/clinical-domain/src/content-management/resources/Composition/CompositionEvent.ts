import { Schema } from 'effect'
import type { CompositionEvent as FhirCompositionEvent } from 'fhir/r4'
import type { BackboneElement } from '../../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../../data-types/base/BackboneElement'
import type { Reference } from '../../../data-types/complex/IdentifierAndReference'
import { ReferenceFromFhirR4 } from '../../../data-types/complex/IdentifierAndReference'
import type { CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../../data-types/complex/CodeableConcept'
import type { Period } from '../../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../../data-types/complex/Period'
import type { DeepReadonly } from '@assessmentis/util'

const CompositionEventId = Schema.String.pipe(
  Schema.brand('CompositionEventId')
)
type CompositionEventId = typeof CompositionEventId.Type

export interface CompositionEvent extends BackboneElement<CompositionEventId> {
  code?: ReadonlyArray<CodeableConcept>
  period?: Period
  detail?: ReadonlyArray<Reference>
}

/**
 * The clinical service(s) being documented
 */
export const CompositionEventFromFhirR4: Schema.Schema<
  CompositionEvent,
  DeepReadonly<FhirCompositionEvent>,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(CompositionEventId),
  Schema.Struct({
    code: Schema.optional(
      Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
    ),
    period: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
    detail: Schema.optional(
      Schema.Array(Schema.suspend(() => ReferenceFromFhirR4))
    ),
  })
)
