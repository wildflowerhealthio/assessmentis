import { Schema } from 'effect'

import { AnnotateArrayWithArbitrary } from '@assessmentis/util'

import { BackboneElement, CodeableConcept, Quantity, Range } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'

const DomainType = 'ObservationReferenceRange' as const
type DomainType = typeof DomainType

const fields = {
  age: Schema.optional(Schema.suspend(() => Range)),
  appliesTo: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  high: Schema.optional(Schema.suspend(() => Quantity)),
  low: Schema.optional(Schema.suspend(() => Quantity)),
  text: Schema.optional(Schema.String),
  type: Schema.optional(Schema.suspend(() => CodeableConcept)),
} as const satisfies Schema.Struct.Fields

/** Encoded (wire-format) shape of an {@link ObservationReferenceRange}. */
export interface ObservationReferenceRangeEncoded
  extends Schema.Struct.Encoded<typeof fields>, BackboneElementEncoded<DomainType> {}

/** Guidance on how to interpret an {@link Observation} value relative to normal or recommended ranges. */
const BackboneElementMixin = BackboneElement(DomainType)

export class ObservationReferenceRange extends BackboneElementMixin.extend<ObservationReferenceRange>(
  DomainType
)(fields) {
  static DomainType = BackboneElementMixin.DomainType
  static UrlSchema = BackboneElementMixin.UrlSchema
}
