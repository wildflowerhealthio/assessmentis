import { Schema } from 'effect'
import type FhirR4 from 'fhir/r4'
import {
  DiagnosticReport,
  type DiagnosticReportEncoded,
  DiagnosticReportStatus,
} from '@assessmentis/clinical-domain'
import { ResourceEncodedFromFhirR4Resource } from '../../data-types/base/Resource'
import { BackboneElementEncodedFromFhir } from '../../data-types/base/BackboneElement'
import {
  IdentifierEncodedFromFhir,
  ReferenceEncodedFromFhir,
} from '../../data-types/complex/IdentifierAndReference'
import { CodeableConceptEncodedFromFhir } from '../../data-types/complex/CodeableConcept'
import { AttachmentEncodedFromFhir } from '../../data-types/complex/Attachment'
import { PeriodEncodedFromFhir } from '../../data-types/complex/Period'
import type { BaseUrl } from '../../data-types/UrlIdentification'
import { mutableEncoded } from '@assessmentis/util'

// --- Sub-component ---

const DiagnosticReportMediaEncodedFromFhir = Schema.extend(
  BackboneElementEncodedFromFhir('DiagnosticReportMedia'),
  mutableEncoded(
    Schema.Struct({
      comment: Schema.optional(Schema.String),
      link: Schema.suspend(() => ReferenceEncodedFromFhir),
    })
  )
)

// --- DiagnosticReport ---

const FhirR4DiagnosticReportEncodedFromFhir: Schema.Schema<
  DiagnosticReportEncoded,
  FhirR4.DiagnosticReport,
  BaseUrl
> = Schema.extend(
  ResourceEncodedFromFhirR4Resource('DiagnosticReport', 'DiagnosticReport'),
  mutableEncoded(
    Schema.Struct({
      identifier: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => IdentifierEncodedFromFhir))
        )
      ),
      basedOn: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      status: DiagnosticReportStatus,
      category: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      code: Schema.suspend(() => CodeableConceptEncodedFromFhir),
      subject: Schema.optional(Schema.suspend(() => ReferenceEncodedFromFhir)),
      encounter: Schema.optional(
        Schema.suspend(() => ReferenceEncodedFromFhir)
      ),
      effectiveDateTime: Schema.optional(Schema.String),
      effectivePeriod: Schema.optional(
        Schema.suspend(() => PeriodEncodedFromFhir)
      ),
      issued: Schema.optional(Schema.String),
      performer: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      resultsInterpreter: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      specimen: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      result: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      imagingStudy: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => ReferenceEncodedFromFhir))
        )
      ),
      media: Schema.optional(
        mutableEncoded(Schema.Array(DiagnosticReportMediaEncodedFromFhir))
      ),
      conclusion: Schema.optional(Schema.String),
      conclusionCode: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => CodeableConceptEncodedFromFhir))
        )
      ),
      presentedForm: Schema.optional(
        mutableEncoded(
          Schema.Array(Schema.suspend(() => AttachmentEncodedFromFhir))
        )
      ),
    })
  )
)

export const FhirR4DiagnosticReport = {
  resourceType: 'DiagnosticReport',
  Schema: Schema.compose(
    FhirR4DiagnosticReportEncodedFromFhir,
    DiagnosticReport
  ),
}
