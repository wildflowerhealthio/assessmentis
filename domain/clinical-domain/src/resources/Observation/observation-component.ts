import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import { AnnotateArrayWithArbitrary } from '@assessmentis/util'

import { BackboneElement, CodeableConcept, DatatypeChoice } from '../../data-types'
import type { BackboneElementEncoded } from '../../data-types'
import FhirR4ChoiceElements from '../../data-types/fhir-r4-choice-elements'
import { ObservationReferenceRange } from './observation-reference-range'

const DomainType = 'ObservationComponent' as const
type DomainType = typeof DomainType

const fields = {
  code: Schema.suspend(() => CodeableConcept),
  dataAbsentReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  interpretation: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  referenceRange: Schema.optional(
    Schema.Array(ObservationReferenceRange).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  value: pipe(
    Schema.UndefinedOr(DatatypeChoice(FhirR4ChoiceElements['Observation.component.value[x]'])),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
}

/** Encoded (wire-format) shape of an {@link ObservationComponent}. */
export interface ObservationComponentEncoded
  extends Schema.Struct.Encoded<typeof fields>, BackboneElementEncoded<DomainType> {}

/** A component result within an {@link Observation}, carrying its own code and value[x] choice. */
const ObservationComponentBackboneElement = BackboneElement(DomainType)

export class ObservationComponent extends ObservationComponentBackboneElement.extend<ObservationComponent>(
  DomainType
)(fields) {
  static DomainType = ObservationComponentBackboneElement.DomainType
  static UrlSchema = ObservationComponentBackboneElement.UrlSchema
}
