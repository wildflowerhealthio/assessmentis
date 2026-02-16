import type { DateTime } from 'effect'
import { Schema } from 'effect'
import type fhir from 'fhir/r4'
import type { DomainResource } from '../../data-types/base/DomainResource'
import { DomainResourceFromFhirR4 } from '../../data-types/base/DomainResource'
import type { BackboneElement } from '../../data-types/base/BackboneElement'
import { BackboneElementFromFhirR4 } from '../../data-types/base/BackboneElement'
import type {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import {
  IdentifierFromFhirR4,
  ReferenceFromFhirR4,
} from '../../data-types/complex/IdentifierAndReference'
import type { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { CodeableConceptFromFhirR4 } from '../../data-types/complex/CodeableConcept'
import type { Attachment as AttachmentType } from '../../data-types/complex/Attachment'
import { AttachmentFromFhirR4 } from '../../data-types/complex/Attachment'
import type { Period } from '../../data-types/complex/Period'
import { PeriodFromFhirR4 } from '../../data-types/complex/Period'

export const DiagnosticReportId = Schema.String.pipe(
  Schema.brand('DiagnosticReportId')
)

export type DiagnosticReportId = typeof DiagnosticReportId.Type

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

export type DiagnosticReportStatus = typeof DiagnosticReportStatus.Type

const DiagnosticReportMediaId = Schema.String.pipe(
  Schema.brand('DiagnosticReportMediaId')
)
type DiagnosticReportMediaId = typeof DiagnosticReportMediaId.Type

export interface DiagnosticReportMedia extends BackboneElement<DiagnosticReportMediaId> {
  comment?: string
  link: Reference
}

const DiagnosticReportMediaFromFhirR4: Schema.Schema<
  DiagnosticReportMedia,
  fhir.DiagnosticReportMedia,
  never
> = Schema.extend(
  BackboneElementFromFhirR4(DiagnosticReportMediaId),
  Schema.Struct({
    comment: Schema.optional(Schema.String),
    link: Schema.suspend(() => ReferenceFromFhirR4),
  })
)

/**
 * The findings and interpretation of diagnostic tests performed on patients,
 * groups of patients, devices, and locations, and/or specimens derived from these.
 */
export interface DiagnosticReport extends DomainResource<DiagnosticReportId> {
  resourceType: 'DiagnosticReport'
  identifier?: Identifier[]
  basedOn?: Reference[]
  status: DiagnosticReportStatus
  category?: CodeableConcept[]
  code: CodeableConcept
  subject?: Reference
  encounter?: Reference
  effectiveDateTime?: DateTime.Utc
  effectivePeriod?: Period
  issued?: DateTime.Utc
  performer?: Reference[]
  resultsInterpreter?: Reference[]
  specimen?: Reference[]
  result?: Reference[]
  imagingStudy?: Reference[]
  media?: DiagnosticReportMedia[]
  conclusion?: string
  conclusionCode?: CodeableConcept[]
  presentedForm?: AttachmentType[]
}

export const DiagnosticReportFromFhirR4: Schema.Schema<
  DiagnosticReport,
  fhir.DiagnosticReport,
  never
> = Schema.extend(
  DomainResourceFromFhirR4(DiagnosticReportId),
  Schema.Struct({
    resourceType: Schema.Literal('DiagnosticReport'),
    identifier: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => IdentifierFromFhirR4)))
    ),
    basedOn: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    status: DiagnosticReportStatus,
    category: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4)))
    ),
    code: Schema.suspend(() => CodeableConceptFromFhirR4),
    subject: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    encounter: Schema.optional(Schema.suspend(() => ReferenceFromFhirR4)),
    effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
    effectivePeriod: Schema.optional(Schema.suspend(() => PeriodFromFhirR4)),
    issued: Schema.optional(Schema.DateTimeUtc),
    performer: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    resultsInterpreter: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    specimen: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    result: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    imagingStudy: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => ReferenceFromFhirR4)))
    ),
    media: Schema.optional(Schema.mutable(Schema.Array(DiagnosticReportMediaFromFhirR4))),
    conclusion: Schema.optional(Schema.String),
    conclusionCode: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => CodeableConceptFromFhirR4)))
    ),
    presentedForm: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => AttachmentFromFhirR4)))
    ),
  })
)
