import type { DateTime } from 'effect'
import { pipe, Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { DomainResource } from '../../data-types/base/DomainResource'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Annotation } from '../../data-types/complex/Annotation'
import { Period } from '../../data-types/complex/Period'
import { ValueElement } from '../../data-types/primitive/ValueElement'
import { Quantity } from '../../data-types/complex/Quantity'
import { Range } from '../../data-types/complex/Range'
import { WithSymbolTag } from '@assessmentis/util'
import { Resource } from '@assessmentis/effectful-store'

const ResourceSymbol: unique symbol = Symbol.for(
  '@assessmentis/clinical-domain/Observation'
)
type ResourceSymbol = typeof ResourceSymbol

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
  age?: Range
  text?: string
}

const ObservationReferenceRangeSchema = Schema.extend(
  BackboneElement.Schema(ObservationReferenceRangeId),
  Schema.Struct({
    low: Schema.optional(Schema.suspend(() => Quantity.Schema)),
    high: Schema.optional(Schema.suspend(() => Quantity.Schema)),
    type: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
    appliesTo: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConcept.Schema)))
    ),
    age: Schema.optional(Schema.suspend(() => Range.Schema)),
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

const ObservationComponentSchema = Schema.extend(
  Schema.extend(
    BackboneElement.Schema(ObservationComponentId),
    Schema.Struct({
      code: Schema.suspend(() => CodeableConcept.Schema),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => CodeableConcept.Schema)
      ),
      interpretation: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      referenceRange: Schema.optional(
        Schema.mutable(Schema.Array(ObservationReferenceRangeSchema))
      ),
    })
  ),
  Schema.suspend(() => ValueElement.Schema)
)

// --- Observation ---

/**
 * Measurements and simple assertions made about a patient, device or other subject.
 */
export interface Observation
  extends
    DomainResource<ObservationId>,
    Resource.Resource<ResourceSymbol, Resource.ReadonlyUrl>,
    ValueElement {
  [Resource.ResourceType]: ResourceSymbol
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

const ObservationSchema = pipe(
  DomainResource.Schema(ObservationId),
  WithSymbolTag(Resource.ResourceType, ResourceSymbol),
  Schema.extend(Schema.suspend(() => ValueElement.Schema)),
  Schema.extend(
    Schema.Struct({
      resourceType: Schema.Literal('Observation'),
      identifier: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
      ),
      basedOn: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      partOf: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      status: ObservationStatus,
      category: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      code: Schema.suspend(() => CodeableConcept.Schema),
      subject: Schema.optional(Schema.suspend(() => Reference.Schema)),
      focus: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      encounter: Schema.optional(Schema.suspend(() => Reference.Schema)),
      effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
      effectivePeriod: Schema.optional(Schema.suspend(() => Period.Schema)),
      effectiveInstant: Schema.optional(Schema.DateTimeUtc),
      issued: Schema.optional(Schema.DateTimeUtc),
      performer: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      dataAbsentReason: Schema.optional(
        Schema.suspend(() => CodeableConcept.Schema)
      ),
      interpretation: Schema.optional(
        Schema.mutable(
          Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
        )
      ),
      note: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Annotation.Schema)))
      ),
      bodySite: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      method: Schema.optional(Schema.suspend(() => CodeableConcept.Schema)),
      specimen: Schema.optional(Schema.suspend(() => Reference.Schema)),
      device: Schema.optional(Schema.suspend(() => Reference.Schema)),
      referenceRange: Schema.optional(
        Schema.mutable(Schema.Array(ObservationReferenceRangeSchema))
      ),
      hasMember: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      derivedFrom: Schema.optional(
        Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
      ),
      component: Schema.optional(
        Schema.mutable(Schema.Array(ObservationComponentSchema))
      ),
    })
  )
)

type ObservationEncoded = Schema.Schema.Encoded<typeof ObservationSchema>

/**
 * Schema for transforming between Observation Data objects and FHIR R4 Observation resources.
 */
export const Observation = ClinicalResourceBehaviourImpl<
  Observation,
  ObservationEncoded
>({
  ResourceSymbol,
  resourceType: 'Observation',
  Schema: ObservationSchema,
})
