import { Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { Period } from '../../data-types'
import { Resource } from '../../data-types/base/Resource'
import type { ResourceEncoded } from '../../data-types/base/Resource'
import { Attachment } from '../../data-types/complex/Attachment'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { DatatypeChoice } from '../../data-types/Datatype'
import FhirR4ChoiceElements from '../../data-types/fhirR4ChoiceElements'
import { DiagnosticReportMedia } from './DiagnosticReportMedia'

const DomainType = 'DiagnosticReport' as const
type DomainType = typeof DomainType

/**
 * The status of the diagnostic report.
 */
export const DiagnosticReportStatus = Schema.Enums({
  registered: 'registered',
  partial: 'partial',
  preliminary: 'preliminary',
  final: 'final',
  amended: 'amended',
  corrected: 'corrected',
  appended: 'appended',
  cancelled: 'cancelled',
  'entered-in-error': 'entered-in-error',
  unknown: 'unknown',
} as const)

/** Decoded status value for a {@link DiagnosticReport}. */
export type DiagnosticReportStatus = typeof DiagnosticReportStatus.Type

const fields = {
  identifier: Schema.optional(Schema.Array(Schema.suspend(() => Identifier))),
  basedOn: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  status: DiagnosticReportStatus,
  category: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  code: Schema.suspend(() => CodeableConcept),
  subject: Schema.optional(Schema.suspend(() => Reference)),
  encounter: Schema.optional(Schema.suspend(() => Reference)),

  issued: Schema.optional(Schema.DateTimeUtc),
  performer: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  resultsInterpreter: Schema.optional(
    Schema.Array(Schema.suspend(() => Reference))
  ),
  specimen: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  result: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  imagingStudy: Schema.optional(Schema.Array(Schema.suspend(() => Reference))),
  media: Schema.optional(Schema.Array(DiagnosticReportMedia)),
  conclusion: Schema.optional(Schema.String),
  conclusionCode: Schema.optional(
    Schema.Array(Schema.suspend(() => CodeableConcept))
  ),
  presentedForm: Schema.optional(
    Schema.Array(Schema.suspend(() => Attachment))
  ),
  effective: Schema.optional(
    DatatypeChoice(FhirR4ChoiceElements['DiagnosticReport.effective[x]'], [
      Period.Datatype,
    ])
  ),
} as const satisfies Schema.Struct.Fields

const resourceMixin = Resource(DomainType)

/** Encoded (wire-format) shape of a {@link DiagnosticReport}. */
export interface DiagnosticReportEncoded
  extends Schema.Struct.Encoded<typeof fields>, ResourceEncoded<DomainType> {}

/**
 * The findings and interpretation of diagnostic tests performed on patients,
 * groups of patients, devices, and locations, and/or specimens derived from these.
 */
export class DiagnosticReport extends MergeClasses<DiagnosticReport>(
  DomainType
)([], resourceMixin, fields) {}
