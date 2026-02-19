import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {} from '../../FhirR4ResourceBehaviour'
import type {
  Observation,
  ObservationReferenceRange,
  ObservationComponent,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  ObservationId,
  ObservationStatus,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import { FhirR4BackboneElement } from '../../data-types/base/BackboneElement'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Annotation } from '../../data-types/complex/Annotation'
import { FhirR4Period } from '../../data-types/complex/Period'
import { FhirR4ValueElement } from '../../data-types/primitive/ValueElement'
import { FhirR4Quantity } from '../../data-types/complex/Quantity'
import { FhirR4Range } from '../../data-types/complex/Range'

// --- Sub-component IDs ---

const ObservationReferenceRangeId = Schema.String.pipe(
  Schema.brand('ObservationReferenceRangeId')
)

const ObservationComponentId = Schema.String.pipe(
  Schema.brand('ObservationComponentId')
)

// --- Sub-component schemas ---

const FhirR4ObservationReferenceRangeSchema: Schema.Schema<
  ObservationReferenceRange,
  FhirR4.ObservationReferenceRange,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(ObservationReferenceRangeId),
  Schema.Struct({
    low: Schema.optional(Schema.suspend(() => FhirR4Quantity.Schema)),
    high: Schema.optional(Schema.suspend(() => FhirR4Quantity.Schema)),
    type: Schema.optional(Schema.suspend(() => FhirR4CodeableConcept.Schema)),
    appliesTo: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    age: Schema.optional(Schema.suspend(() => FhirR4Range.Schema)),
    text: Schema.optional(Schema.String),
  })
)

const FhirR4ObservationComponentSchema: Schema.Schema<
  ObservationComponent,
  FhirR4.ObservationComponent,
  never
> = Schema.extend(
  Schema.extend(
    FhirR4BackboneElement.Schema(ObservationComponentId),
    Schema.Struct({
      code: Schema.suspend(() => FhirR4CodeableConcept.Schema),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      interpretation: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      referenceRange: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4ObservationReferenceRangeSchema))
      ),
    })
  ),
  Schema.suspend(() => FhirR4ValueElement.Schema)
)

// --- Observation ---

const FhirR4ObservationSchema: Schema.Schema<
  Observation,
  FhirR4.Observation,
  never
> = Schema.extend(
  Schema.extend(
    FhirR4DomainResource.Schema(ObservationId),
    Schema.Struct({
      resourceType: Schema.Literal('Observation'),
      identifier: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
        )
      ),
      basedOn: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      partOf: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      status: ObservationStatus,
      category: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      code: Schema.suspend(() => FhirR4CodeableConcept.Schema),
      subject: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      focus: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
      effectivePeriod: Schema.optional(
        Schema.suspend(() => FhirR4Period.Schema)
      ),
      effectiveInstant: Schema.optional(Schema.DateTimeUtc),
      issued: Schema.optional(Schema.DateTimeUtc),
      performer: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      interpretation: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
        )
      ),
      note: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Annotation.Schema))
        )
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      method: Schema.optional(
        Schema.suspend(() => FhirR4CodeableConcept.Schema)
      ),
      specimen: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      device: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
      referenceRange: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4ObservationReferenceRangeSchema))
      ),
      hasMember: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      derivedFrom: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => FhirR4Reference.Schema))
        )
      ),
      component: Schema.optional(
        Schema.mutable(Schema.Array(FhirR4ObservationComponentSchema))
      ),
    })
  ),
  Schema.suspend(() => FhirR4ValueElement.Schema)
)

export const FhirR4Observation = {
  resourceType: 'Observation',
  Schema: FhirR4ObservationSchema,
}
