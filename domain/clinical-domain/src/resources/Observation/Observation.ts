import { Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import { Resource, type ResourceEncoded } from '../../data-types/base/Resource'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Annotation } from '../../data-types/complex/Annotation'
import { Period } from '../../data-types/complex/Period'
import { Quantity } from '../../data-types/complex/Quantity'
import { Range } from '../../data-types/complex/Range'
import { DatatypeChoice } from '../../data-types/Datatype'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'

const Key = 'Observation' as const
type Key = typeof Key

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

// --- Sub-component schemas ---

export class ObservationReferenceRange extends MergeClasses<ObservationReferenceRange>(
  'ObservationReferenceRange'
)(BackboneElement('ObservationReferenceRange'), {
  low: Schema.optional(Schema.suspend(() => Quantity)),
  high: Schema.optional(Schema.suspend(() => Quantity)),
  type: Schema.optional(Schema.suspend(() => CodeableConcept)),
  appliesTo: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  age: Schema.optional(Schema.suspend(() => Range)),
  text: Schema.optional(Schema.String),
}) {}

const componentValueMixin = DatatypeChoice(
  'value',
  FhirR4ChoiceElements['Observation.component.value[x]']
)

const ObservationComponentSchema = Schema.Struct({
  ...BackboneElement('ObservationComponent').fields,
  ...componentValueMixin.fields,
  code: Schema.suspend(() => CodeableConcept),
  dataAbsentReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  interpretation: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  referenceRange: Schema.optional(Schema.Array(ObservationReferenceRange)),
})

// --- Observation ---

const ObservationValueMixin = DatatypeChoice(
  'value',
  FhirR4ChoiceElements['Observation.value[x]']
)

const fields = {
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  basedOn: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  partOf: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  status: ObservationStatus,
  category: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  code: Schema.suspend(() => CodeableConcept),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  focus: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
  effectivePeriod: Schema.optional(Schema.suspend(() => Period)),
  effectiveInstant: Schema.optional(Schema.DateTimeUtc),
  issued: Schema.optional(Schema.DateTimeUtc),
  performer: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  dataAbsentReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  interpretation: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  note: Schema.optional(Schema.Array(Schema.suspend(() => Annotation))),
  bodySite: Schema.optional(Schema.suspend(() => CodeableConcept)),
  method: Schema.optional(Schema.suspend(() => CodeableConcept)),
  specimen: Schema.optional(Schema.suspend(() => Reference)),
  device: Schema.optional(Schema.suspend(() => Reference)),
  referenceRange: Schema.optional(Schema.Array(ObservationReferenceRange)),
  hasMember: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  derivedFrom: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  component: Schema.optional(Schema.Array(ObservationComponentSchema)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(Key)

type ObservationValueMixinEncoded = typeof ObservationValueMixin.Encoded
export interface ObservationEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    ResourceEncoded<Key>,
    ObservationValueMixinEncoded {}

/**
 * Measurements and simple assertions made about a patient, device or other subject.
 */
export class Observation extends MergeClasses<Observation>(Key)(
  fields,
  resourceMixin,
  ObservationValueMixin
) {}
