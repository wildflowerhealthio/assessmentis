import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary, MergeClasses } from '@assessmentis/util'

import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import { Annotation } from '../../data-types/complex/Annotation'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { DatatypeChoice } from '../../data-types/Datatype'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { ObservationComponent } from './ObservationComponent'
import { ObservationReferenceRange } from './ObservationReferenceRange'

const DomainType = 'Observation' as const
type DomainType = typeof DomainType

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

/** Decoded status value for an {@link Observation}. */
export type ObservationStatus = typeof ObservationStatus.Type

// --- Observation ---

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
  focus: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  issued: Schema.optional(Schema.DateTimeUtc),
  performer: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  value: Schema.optional(
    DatatypeChoice(FhirR4ChoiceElements['Observation.value[x]'])
  ),
  effective: Schema.optional(
    DatatypeChoice(FhirR4ChoiceElements['Observation.effective[x]'])
  ),
  dataAbsentReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  interpretation: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  note: Schema.optional(Schema.Array(Schema.suspend(() => Annotation))),
  bodySite: Schema.optional(Schema.suspend(() => CodeableConcept)),
  method: Schema.optional(Schema.suspend(() => CodeableConcept)),
  specimen: Schema.optional(Schema.suspend(() => Reference)),
  device: Schema.optional(Schema.suspend(() => Reference)),
  referenceRange: Schema.optional(
    Schema.Array(ObservationReferenceRange).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  hasMember: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  derivedFrom: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  component: Schema.optional(
    Schema.Array(ObservationComponent).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of an {@link Observation}. */
export interface ObservationEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * Measurements and simple assertions made about a patient, device or other subject.
 */
export class Observation extends MergeClasses<Observation>(DomainType)(
  [],
  fields,
  resourceMixin
) {}
