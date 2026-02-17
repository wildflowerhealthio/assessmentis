import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import { FhirR4ResourceBehaviourImpl } from '../../FhirR4ResourceBehaviour'
import type {
  DiagnosticReport,
  DiagnosticReportMedia,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import {
  DiagnosticReportId,
  DiagnosticReportStatus,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { FhirR4DomainResource } from '../../data-types/base/DomainResource'
import { FhirR4BackboneElement } from '../../data-types/base/BackboneElement'
import {
  FhirR4Identifier,
  FhirR4Reference,
} from '../../data-types/complex/IdentifierAndReference'
import { FhirR4CodeableConcept } from '../../data-types/complex/CodeableConcept'
import { FhirR4Attachment } from '../../data-types/complex/Attachment'
import { FhirR4Period } from '../../data-types/complex/Period'

// --- Sub-component ---

const DiagnosticReportMediaId = Schema.String.pipe(
  Schema.brand('DiagnosticReportMediaId')
)

const FhirR4DiagnosticReportMediaSchema: Schema.Schema<
  DiagnosticReportMedia,
  FhirR4.DiagnosticReportMedia,
  never
> = Schema.extend(
  FhirR4BackboneElement.Schema(DiagnosticReportMediaId),
  Schema.Struct({
    comment: Schema.optional(Schema.String),
    link: Schema.suspend(() => FhirR4Reference.Schema),
  })
)

// --- DiagnosticReport ---

const FhirR4DiagnosticReportSchema: Schema.Schema<
  DiagnosticReport,
  FhirR4.DiagnosticReport,
  never
> = Schema.extend(
  FhirR4DomainResource.Schema(DiagnosticReportId),
  Schema.Struct({
    resourceType: Schema.Literal('DiagnosticReport'),
    identifier: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Identifier.Schema))
      )
    ),
    basedOn: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    status: DiagnosticReportStatus,
    category: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    code: Schema.suspend(() => FhirR4CodeableConcept.Schema),
    subject: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    encounter: Schema.optional(Schema.suspend(() => FhirR4Reference.Schema)),
    effectiveDateTime: Schema.optional(Schema.DateTimeUtc),
    effectivePeriod: Schema.optional(Schema.suspend(() => FhirR4Period.Schema)),
    issued: Schema.optional(Schema.DateTimeUtc),
    performer: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    resultsInterpreter: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    specimen: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    result: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    imagingStudy: Schema.optional(
      Schema.mutable(Schema.Array(Schema.suspend(() => FhirR4Reference.Schema)))
    ),
    media: Schema.optional(
      Schema.mutable(Schema.Array(FhirR4DiagnosticReportMediaSchema))
    ),
    conclusion: Schema.optional(Schema.String),
    conclusionCode: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4CodeableConcept.Schema))
      )
    ),
    presentedForm: Schema.optional(
      Schema.mutable(
        Schema.Array(Schema.suspend(() => FhirR4Attachment.Schema))
      )
    ),
  })
)

export const FhirR4DiagnosticReport = FhirR4ResourceBehaviourImpl({
  resourceType: 'DiagnosticReport',
  Schema: FhirR4DiagnosticReportSchema,
})
