import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import { Search } from '@assessmentis/effectful-store'
import { AnnotateArrayWithArbitrary, makeCloneWith } from '@assessmentis/util'

import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Annotation } from '../../data-types/complex/annotation'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import { DatatypeChoice } from '../../data-types/datatype'
import FhirR4ChoiceElements from '../../data-types/fhir-r4-choice-elements'
import { Encounter } from '../Encounter/encounter'
import { Patient } from '../Patient/patient'
import { ObservationComponent } from './observation-component'
import { ObservationReferenceRange } from './observation-reference-range'

const DomainType = 'Observation' as const
type DomainType = typeof DomainType

/**
 * The status of the result value.
 */
const ObservationStatus = Schema.Enums({
  amended: 'amended',
  cancelled: 'cancelled',
  corrected: 'corrected',
  'entered-in-error': 'entered-in-error',
  final: 'final',
  preliminary: 'preliminary',
  registered: 'registered',
  unknown: 'unknown',
} as const)

/** Decoded status value for an {@link Observation}. */
type ObservationStatus = typeof ObservationStatus.Type

// --- Observation ---

const fields = {
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  bodySite: Schema.optional(Schema.suspend(() => CodeableConcept)),
  category: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  code: Schema.suspend(() => CodeableConcept),
  component: Schema.optional(
    Schema.Array(ObservationComponent).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  dataAbsentReason: Schema.optional(Schema.suspend(() => CodeableConcept)),
  derivedFrom: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  device: Schema.optional(Schema.suspend(() => Reference)),
  effective: pipe(
    Schema.UndefinedOr(DatatypeChoice(FhirR4ChoiceElements['Observation.effective[x]'])),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
  encounter: Schema.optional(Schema.suspend(() => Reference)),
  focus: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  hasMember: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  interpretation: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  issued: Schema.optional(Schema.DateTimeUtc),
  method: Schema.optional(Schema.suspend(() => CodeableConcept)),
  note: Schema.optional(
    Schema.Array(Schema.suspend(() => Annotation)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  partOf: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  performer: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  referenceRange: Schema.optional(
    Schema.Array(ObservationReferenceRange).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  specimen: Schema.optional(Schema.suspend(() => Reference)),
  status: ObservationStatus,
  subject: Schema.optional(Schema.suspend(() => Reference)),
  value: pipe(
    Schema.UndefinedOr(DatatypeChoice(FhirR4ChoiceElements['Observation.value[x]'])),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
} as const satisfies Schema.Struct.Fields

const ObservationResource = Resource(DomainType)

/** Encoded (wire-format) shape of an {@link Observation}. */
interface ObservationEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * Measurements and simple assertions made about a patient, device or other subject.
 */
class Observation extends ObservationResource.extend<Observation>(DomainType)(fields) {
  static readonly DomainType = ObservationResource.DomainType
  static readonly UrlSchema = ObservationResource.UrlSchema
  static readonly SearchSchema = {
    encounter: Search.field(Encounter.UrlSchema, ['Exactly', 'AnyOf']),
    subject: Search.field(Patient.UrlSchema, ['Exactly']),
  } as const satisfies Search.Schema
  readonly cloneWith = makeCloneWith(Observation, this)
}

export { ObservationStatus, Observation }
export type { ObservationEncoded }
