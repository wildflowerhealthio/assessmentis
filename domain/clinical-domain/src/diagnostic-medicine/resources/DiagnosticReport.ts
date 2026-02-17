import type { DateTime } from 'effect'
import { Schema } from 'effect'
import { ClinicalResourceBehaviourImpl } from '../../ClinicalResourceBehaviour'
import { DomainResource } from '../../data-types/base/DomainResource'
import { BackboneElement } from '../../data-types/base/BackboneElement'
import {
  Identifier,
  Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { Attachment } from '../../data-types/complex/Attachment'
import { Period } from '../../data-types/complex/Period'

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

const DiagnosticReportMediaSchema = Schema.extend(
  BackboneElement.Schema(DiagnosticReportMediaId),
  Schema.Struct({
    comment: Schema.optional(Schema.String),
    link: Schema.suspend(() => Reference.Schema),
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
  presentedForm?: Attachment[]
}

export const DiagnosticReport = ClinicalResourceBehaviourImpl({
  TypeId: Symbol.for('@assessmentis/clinical-domain/DiagnosticReport'),
  resourceType: 'DiagnosticReport',
  Schema: Schema.extend(
    DomainResource.Schema(DiagnosticReportId),
    Schema.mutable(
      Schema.Struct({
        resourceType: Schema.Literal('DiagnosticReport'),
        identifier: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Identifier.Schema)))
        ),
        basedOn: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
        ),
        status: DiagnosticReportStatus,
        category: Schema.optional(
          Schema.mutable(
            Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
          )
        ),
        code: Schema.suspend(() => CodeableConcept.Schema),
        subject: Schema.optional(Schema.suspend(() => Reference.Schema)),
        encounter: Schema.optional(Schema.suspend(() => Reference.Schema)),
        effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
        effectivePeriod: Schema.optional(Schema.suspend(() => Period.Schema)),
        issued: Schema.optional(Schema.DateTimeUtc),
        performer: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
        ),
        resultsInterpreter: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
        ),
        specimen: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
        ),
        result: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
        ),
        imagingStudy: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Reference.Schema)))
        ),
        media: Schema.optional(
          Schema.mutable(Schema.Array(DiagnosticReportMediaSchema))
        ),
        conclusion: Schema.optional(Schema.String),
        conclusionCode: Schema.optional(
          Schema.mutable(
            Schema.Array(Schema.suspend(() => CodeableConcept.Schema))
          )
        ),
        presentedForm: Schema.optional(
          Schema.mutable(Schema.Array(Schema.suspend(() => Attachment.Schema)))
        ),
      })
    )
  ),
})
