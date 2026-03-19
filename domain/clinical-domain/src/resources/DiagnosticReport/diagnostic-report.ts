import { Schema, pipe } from 'effect'
import type { Arbitrary, FastCheck } from 'effect'

import { AnnotateArrayWithArbitrary } from '@assessmentis/util'

import { Period } from '../../data-types'
import { Resource } from '../../data-types/base/resource'
import type { ResourceEncoded } from '../../data-types/base/resource'
import { Attachment } from '../../data-types/complex/attachment'
import { CodeableConcept } from '../../data-types/complex/codeable-concept'
import { Identifier, Reference } from '../../data-types/complex/identifier-and-reference'
import { DatatypeChoice } from '../../data-types/datatype'
import FhirR4ChoiceElements from '../../data-types/fhir-r4-choice-elements'
import { DiagnosticReportMedia } from './diagnostic-report-media'

const DomainType = 'DiagnosticReport' as const
type DomainType = typeof DomainType

/**
 * The status of the diagnostic report.
 */
export const DiagnosticReportStatus = Schema.Enums({
  amended: 'amended',
  appended: 'appended',
  cancelled: 'cancelled',
  corrected: 'corrected',
  'entered-in-error': 'entered-in-error',
  final: 'final',
  partial: 'partial',
  preliminary: 'preliminary',
  registered: 'registered',
  unknown: 'unknown',
} as const)

/** Decoded status value for a {@link DiagnosticReport}. */
export type DiagnosticReportStatus = typeof DiagnosticReportStatus.Type

const fields = {
  basedOn: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  category: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  code: Schema.suspend(() => CodeableConcept),
  conclusion: Schema.optional(Schema.String),
  conclusionCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  effective: pipe(
    Schema.UndefinedOr(
      DatatypeChoice(FhirR4ChoiceElements['DiagnosticReport.effective[x]'], [Period.Datatype])
    ),
    Schema.annotations({
      arbitrary: (): Arbitrary.LazyArbitrary<undefined> => (fc: typeof FastCheck) =>
        fc.constant(undefined),
    }),
    Schema.optionalWith({ default: () => undefined })
  ),
  encounter: Schema.optional(Schema.suspend(() => Reference)),

  identifier: Schema.optional(
    Schema.Array(Schema.suspend(() => Identifier)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  imagingStudy: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  issued: Schema.optional(Schema.DateTimeUtc),
  media: Schema.optional(
    Schema.Array(DiagnosticReportMedia).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  performer: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  presentedForm: Schema.optional(
    Schema.Array(Schema.suspend(() => Attachment)).pipe(
      AnnotateArrayWithArbitrary({ maxLength: 2 })
    )
  ),
  result: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  resultsInterpreter: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  specimen: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference)).pipe(AnnotateArrayWithArbitrary({ maxLength: 2 }))
  ),
  status: DiagnosticReportStatus,
  subject: Schema.optional(Schema.suspend(() => Reference)),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link DiagnosticReport}. */
export interface DiagnosticReportEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * The findings and interpretation of diagnostic tests performed on patients,
 * groups of patients, devices, and locations, and/or specimens derived from these.
 */
export class DiagnosticReport extends resourceMixin.extend<DiagnosticReport>(DomainType)(fields) {
  static DomainType = resourceMixin.DomainType
  static UrlSchema = resourceMixin.UrlSchema
}
