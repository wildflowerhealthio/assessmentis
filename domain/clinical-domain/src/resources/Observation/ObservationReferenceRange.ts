import { Schema } from 'effect'
import {
  CodeableConcept,
  Quantity,
  Range,
  BackboneElement,
  type BackboneElementEncoded,
} from '../../data-types'
import { MergeClasses } from '@assessmentis/util'

const DomainType = 'ObservationReferenceRange' as const
type DomainType = typeof DomainType

const fields = {
  low: Schema.optional(Schema.suspend(() => Quantity)),
  high: Schema.optional(Schema.suspend(() => Quantity)),
  type: Schema.optional(Schema.suspend(() => CodeableConcept)),
  appliesTo: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  age: Schema.optional(Schema.suspend(() => Range)),
  text: Schema.optional(Schema.String),
} as const satisfies Schema.Struct.Fields

export interface ObservationReferenceRangeEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType> {}

export class ObservationReferenceRange extends MergeClasses<ObservationReferenceRange>(
  DomainType
)([], BackboneElement(DomainType), fields) {}
