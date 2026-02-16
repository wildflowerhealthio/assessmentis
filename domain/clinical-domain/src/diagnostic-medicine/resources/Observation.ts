import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { DomainResource } from '../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../data-types/base/DomainResource'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Annotation } from '../../data-types/complex/Annotation'
import { AnnotationFromFhirR4 } from '../../data-types/complex/Annotation'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'
import type { ValueElement } from '../../data-types/primitive/ValueElement'
import { ValueElementFromFhirR4 } from '../../data-types/primitive/ValueElement'
import {
  type Quantity,
  QuantityFromFhirR4,
} from '../../data-types/complex/Quantity'
import { Range } from '../../data-types/complex/Range'

export const ObservationId = Schema.String.pipe(Schema.brand('ObservationId'))

export type ObservationId = typeof ObservationId.Type

/**
 * The status of the result value.
 */
export const ObservationStatus = Schema.Enums({
  registered: 'registered',
  preliminary: 'preliminary',
  final: 'final',
  amended: 'amended',
  corrected: 'corrected',
  cancelled: 'cancelled',
  'entered-in-error': 'entered-in-error',
  unknown: 'unknown',
} as const)

export type ObservationStatus = typeof ObservationStatus.Type

const ObservationReferenceRangeId = Schema.String.pipe(
  Schema.brand('ObservationReferenceRangeId')
)
type ObservationReferenceRangeId = typeof ObservationReferenceRangeId.Type

export interface ObservationReferenceRange extends BackboneElement<ObservationReferenceRangeId> {
  low?: Quantity
  high?: Quantity
  type?: CodeableConcept
  appliesTo?: CodeableConcept[]
  age?: import('../../data-types/complex/Range').Range
  text?: string
}

const ObservationReferenceRangeFromFhirR4: Schema.Schema<
  ObservationReferenceRange,
  fhir.ObservationReferenceRange,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(ObservationReferenceRangeId),
  Schema.Struct({
    low: Schema.optional(Schema.suspend(() => QuantityFromFhirR4)),
    high: Schema.optional(Schema.suspend(() => QuantityFromFhirR4)),
    type: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
    appliesTo: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
      )
    ),
    age: Schema.optional(Schema.suspend(() => Range)),
    text: Schema.optional(Schema.String),
  })
)

const ObservationComponentId = Schema.String.pipe(
  Schema.brand('ObservationComponentId')
)
type ObservationComponentId = typeof ObservationComponentId.Type

export interface ObservationComponent
  extends BackboneElement<ObservationComponentId>, ValueElement {
  code: CodeableConcept
  dataAbsentReason?: CodeableConcept
  interpretation?: CodeableConcept[]
  referenceRange?: ObservationReferenceRange[]
}

const ObservationComponentFromFhirR4: Schema.Schema<
  ObservationComponent,
  fhir.ObservationComponent,
  never
> = Schema.extend(
  Schema.extend(
    BackboneElementFromFhirR4(ObservationComponentId),
    Schema.Struct({
      code: Schema.suspend(() => CodeableConceptFromFhirR4),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => CodeableConceptFromFhirR4)
      ),
      interpretation: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
        )
      ),
      referenceRange: Schema.optional(
        Schema.mutable(Schema.Array(ObservationReferenceRangeFromFhirR4))
      ),
    })
  ),
  Schema.suspend(() => ValueElementFromFhirR4)
)

/**
 * Measurements and simple assertions made about a patient, device or other subject.
 */
export interface Observation
  extends DomainResource<ObservationId>, ValueElement {
  resourceType: 'Observation'
  identifier?: Identifier[]
  basedOn?: Reference[]
  partOf?: Reference[]
  status: ObservationStatus
  category?: CodeableConcept[]
  code: CodeableConcept
  subject?: Reference
  focus?: Reference[]
  encounter?: Reference
  effectiveDateTime?: DateTime.Utc
  effectivePeriod?: Period
  effectiveInstant?: DateTime.Utc
  issued?: DateTime.Utc
  performer?: Reference[]
  dataAbsentReason?: CodeableConcept
  interpretation?: CodeableConcept[]
  note?: Annotation[]
  bodySite?: CodeableConcept
  method?: CodeableConcept
  specimen?: Reference
  device?: Reference
  referenceRange?: ObservationReferenceRange[]
  hasMember?: Reference[]
  derivedFrom?: Reference[]
  component?: ObservationComponent[]
}

export const ObservationFromFhirR4: Schema.Schema<
  Observation,
  fhir.Observation,
  never
> = Schema.extend(
  Schema.extend(
    DomainResourceFromFhirR4(ObservationId),
    Schema.Struct({
      resourceType: Schema.Literal('Observation'),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => IdentifierFromFhirR4)))
      ),
      basedOn: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      partOf: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      status: ObservationStatus,
      category: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
        )
      ),
      code: Schema.suspend(() => CodeableConceptFromFhirR4),
      subject: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      focus: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      encounter: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
      effectivePeriod: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
      effectiveInstant: Schema.optional(Schema.DateTimeUtc),
      issued: Schema.optional(Schema.DateTimeUtc),
      performer: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => CodeableConceptFromFhirR4)
      ),
      interpretation: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4))
        )
      ),
      note: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => AnnotationFromFhirR4)))
      ),
      bodySite: Schema.optional(
        Schema.suspend(() => CodeableConceptFromFhirR4)
      ),
      method: Schema.optional(Schema.suspend(() => CodeableConceptFromFhirR4)),
      specimen: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      device: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
      referenceRange: Schema.optional(
        Schema.mutable(Schema.Array(ObservationReferenceRangeFromFhirR4))
      ),
      hasMember: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      derivedFrom: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
      ),
      component: Schema.optional(
        Schema.mutable(Schema.Array(ObservationComponentFromFhirR4))
      ),
    })
  ),
  Schema.suspend(() => ValueElementFromFhirR4)
)
