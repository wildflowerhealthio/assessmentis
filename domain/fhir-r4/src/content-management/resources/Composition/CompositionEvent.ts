import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import type { CompositionEvent } from '@assessmentis/clinical-domain/content-management'
import { FhirR4BackboneElement } from '../../../data-types/base/BackboneElement'
import { FhirR4Reference } from '../../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../../data-types/complex/CodeableConcept'
import { FhirR4Period } from '../../../data-types/complex/Period'

const CompositionEventId = Schema.String.pipe(
  Schema.brand('CompositionEventId')
)

const FhirR4CompositionEventSchema: Schema.Schema<
  CompositionEvent,
  FhirR4.CompositionEvent,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(CompositionEventId),
  Schema.Struct({
    code: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    period: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
    detail: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
      )
    ),
  })
)

export const FhirR4CompositionEvent = {
  Schema: FhirR4CompositionEventSchema,
}
