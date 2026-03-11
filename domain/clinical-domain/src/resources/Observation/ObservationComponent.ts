import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import {
  BackboneElement,
  CodeableConcept,
  DatatypeChoice,
  type BackboneElementEncoded,
} from '../../data-types'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { ObservationReferenceRange } from './ObservationReferenceRange'

const DomainType = 'ObservationComponent' as const
type DomainType = typeof DomainType

const fields = {
  code: Schema.suspend(() => CodeableConcept),
  dataAbsentReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  interpretation: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  referenceRange: Schema.optional(Schema.Array(ObservationReferenceRange)),
}
class ObservationComponentValue extends DatatypeChoice(
  'ObservationComponentValue',
  'value',
  FhirR4ChoiceElements['Observation.component.value[x]']
) {}
type ComponentValueMixinEncoded = typeof ObservationComponentValue.Encoded

/** Encoded (wire-format) shape of an {@link ObservationComponent}. */
export interface ObservationComponentEncoded
  extends
    Schema.Struct.Encoded<typeof fields>,
    BackboneElementEncoded<DomainType>,
    ComponentValueMixinEncoded {}

/** A component result within an {@link Observation}, carrying its own code and value[x] choice. */
export class ObservationComponent extends MergeClasses<ObservationComponent>(
  DomainType
)([], BackboneElement(DomainType), ObservationComponentValue, fields) {}
